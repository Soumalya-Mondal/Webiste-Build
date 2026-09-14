const assert = require("node:assert/strict");
const { accessSync, chmodSync, constants, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { delimiter, join, resolve } = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

const pageUrl = `file://${resolve(__dirname, "../..", "index.html")}`;

function findBrowserExecutable() {
  const names = ["brave", "brave-browser", "chromium", "chromium-browser", "google-chrome"];
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    process.env.BRAVE_PATH,
    ...(process.env.PATH || "").split(delimiter).flatMap((directory) =>
      names.map((name) => resolve(directory, name)),
    ),
    "/usr/bin/brave",
    "/usr/bin/brave-browser",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      accessSync(candidate, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

function withBrowserEnvironment(overrides, callback) {
  const names = ["BROWSER", "BRAVE_PATH", "CHROME_PATH", "CHROMIUM_PATH", "PATH"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));

  try {
    for (const name of names) {
      if (Object.hasOwn(overrides, name)) process.env[name] = overrides[name];
      else delete process.env[name];
    }
    return callback();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("browser discovery uses only supported environment overrides", () => {
  const directory = mkdtempSync(join(tmpdir(), "scrapbook-browser-discovery-"));
  const unrelatedExecutable = join(directory, "unrelated-browser");
  const dedicatedExecutable = join(directory, "custom-browser-build");
  const pathExecutable = join(directory, "chromium");

  try {
    for (const executable of [unrelatedExecutable, dedicatedExecutable, pathExecutable]) {
      writeFileSync(executable, "");
      chmodSync(executable, 0o755);
    }

    assert.equal(
      withBrowserEnvironment(
        { BROWSER: unrelatedExecutable, PATH: directory },
        findBrowserExecutable,
      ),
      pathExecutable,
    );
    assert.equal(
      withBrowserEnvironment(
        { BROWSER: unrelatedExecutable, CHROME_PATH: dedicatedExecutable, PATH: directory },
        findBrowserExecutable,
      ),
      dedicatedExecutable,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("browser executable discovery finds an installed Chromium browser", (t) => {
  const browserExecutable = findBrowserExecutable();
  if (!browserExecutable) {
    t.skip("No supported Brave, Chromium, or Chrome executable found");
    return;
  }
  t.diagnostic(`Browser executable: ${browserExecutable}`);
  assert.doesNotThrow(() => accessSync(browserExecutable, constants.X_OK));
});

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function connectToBrowser(port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
    } catch {
      // Brave may not have opened the debugging endpoint yet.
    }
    await delay(50);
  }
  throw new Error("Chromium remote debugging endpoint did not become available");
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }

    for (const listener of listeners.get(message.method) || []) listener(message);
  });

  return {
    async open() {
      if (socket.readyState === WebSocket.OPEN) return;
      await new Promise((resolveOpen, reject) => {
        socket.addEventListener("open", resolveOpen, { once: true });
        socket.addEventListener("error", reject, { once: true });
      });
    },
    send(method, params = {}, sessionId) {
      return new Promise((resolveRequest, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve: resolveRequest, reject });
        socket.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
    once(method) {
      return new Promise((resolveEvent) => {
        const listener = (message) => {
          listeners.set(
            method,
            (listeners.get(method) || []).filter((candidate) => candidate !== listener),
          );
          resolveEvent(message.params);
        };
        listeners.set(method, [...(listeners.get(method) || []), listener]);
      });
    },
    close() {
      socket.close();
    },
  };
}

test("direct file page passes desktop, mobile, accessibility, and fallback checks", async (t) => {
  const browserExecutable = findBrowserExecutable();
  if (!browserExecutable) {
    t.skip("No supported Brave, Chromium, or Chrome executable found");
    return;
  }

  const port = 12000 + Math.floor(Math.random() * 20000);
  const profile = mkdtempSync(resolve(tmpdir(), "scrapbook-brave-"));
  const browser = spawn(
    browserExecutable,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let cdp;

  t.after(() => {
    cdp?.close();
    browser.kill("SIGTERM");
    rmSync(profile, { recursive: true, force: true });
  });

  const webSocketUrl = await connectToBrowser(port);
  cdp = createCdpClient(webSocketUrl);
  await cdp.open();
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => cdp.send(method, params, sessionId);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text);
    return result.value;
  };
  const navigate = async () => {
    const loaded = cdp.once("Page.loadEventFired");
    await send("Page.navigate", { url: pageUrl });
    await loaded;
  };
  const key = async (keyName, modifiers = 0) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, modifiers });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, modifiers });
  };
  const click = async (selector) => {
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: "center", behavior: "instant" })`,
    );
    const point = await evaluate(`(() => {
      const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    assert.equal(
      await evaluate(
        `document.elementFromPoint(${point.x}, ${point.y}).closest(${JSON.stringify(selector)}) !== null`,
      ),
      true,
    );
    await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point });
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (await evaluate(expression)) return;
      await delay(20);
    }
    throw new Error(`Condition not reached: ${expression}`);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate();

  await t.test("desktop direct-file load updates the counter and renders local images", async () => {
    const state = await evaluate(`(() => ({
      protocol: location.protocol,
      counter: document.querySelector("#days-count").textContent,
      overflow: document.documentElement.scrollWidth > innerWidth,
      viewport: [innerWidth, innerHeight],
      imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0)
    }))()`);
    assert.equal(state.protocol, "file:");
    assert.match(state.counter, /^\d[\d,]*$/);
    assert.deepEqual(state.viewport, [1280, 800]);
    assert.equal(state.overflow, false);
    assert.equal(state.imagesLoaded, true);
  });

  await t.test("story link reaches the counter with normal smooth navigation", async () => {
    await evaluate(`(() => {
      const story = document.querySelector("#story");
      const scrollIntoView = story.scrollIntoView.bind(story);
      window.__storyScrollOptions = null;
      story.scrollIntoView = (options) => {
        window.__storyScrollOptions = options;
        scrollIntoView(options);
      };
    })()`);
    await click(".story-link");
    await waitFor(`(() => {
      const rect = document.querySelector("#days-count").getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    })()`);
    assert.deepEqual(await evaluate(`window.__storyScrollOptions`), { behavior: "smooth" });
  });

  await t.test("keyboard focus has a visible computed focus indicator", async () => {
    await navigate();
    await key("Tab");
    await key("Tab");
    const focus = await evaluate(`(() => {
      const style = getComputedStyle(document.activeElement);
      return {
        className: document.activeElement.className,
        focusVisible: document.activeElement.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth)
      };
    })()`);
    assert.equal(focus.className, "story-link");
    assert.equal(focus.focusVisible, true);
    assert.notEqual(focus.outlineStyle, "none");
    assert.ok(focus.outlineWidth > 0);
  });

  await t.test("lightbox matches cards, cycles, closes, traps focus, and restores focus", async () => {
    await click(".gallery-card:nth-of-type(2)");
    assert.deepEqual(
      await evaluate(`(() => ({
        open: document.querySelector("#memory-lightbox").open,
        caption: document.querySelector("#lightbox-caption").textContent,
        image: document.querySelector("#lightbox-image").getAttribute("src"),
        focus: document.activeElement.id
      }))()`),
      {
        open: true,
        caption: "The evening we stayed until the last stripe of sunset disappeared.",
        image: "asset/images/memory-sunset.svg",
        focus: "lightbox-close",
      },
    );

    await key("Tab", 8);
    assert.equal(await evaluate(`document.activeElement.id`), "lightbox-next");
    await key("Tab");
    assert.equal(await evaluate(`document.activeElement.id`), "lightbox-close");

    await click("#lightbox-previous");
    assert.equal(
      await evaluate(`document.querySelector("#lightbox-image").getAttribute("src")`),
      "asset/images/memory-road-trip.svg",
    );
    await click("#lightbox-previous");
    assert.equal(
      await evaluate(`document.querySelector("#lightbox-image").getAttribute("src")`),
      "asset/images/memory-home.svg",
    );
    await click("#lightbox-next");
    assert.equal(
      await evaluate(`document.querySelector("#lightbox-image").getAttribute("src")`),
      "asset/images/memory-road-trip.svg",
    );
    await key("ArrowRight");
    assert.equal(
      await evaluate(`document.querySelector("#lightbox-image").getAttribute("src")`),
      "asset/images/memory-sunset.svg",
    );
    await key("ArrowLeft");
    assert.equal(
      await evaluate(`document.querySelector("#lightbox-image").getAttribute("src")`),
      "asset/images/memory-road-trip.svg",
    );

    await key("Escape");
    await waitFor(`document.activeElement === document.querySelectorAll(".gallery-card")[1]`);
    assert.deepEqual(
      await evaluate(`(() => ({ open: document.querySelector("#memory-lightbox").open, focus: document.activeElement.textContent.trim() }))()`),
      { open: false, focus: "Chasing the last light" },
    );

    await click(".gallery-card");
    await click("#lightbox-close");
    assert.equal(await evaluate(`document.querySelector("#memory-lightbox").open`), false);

    await click(".gallery-card");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, x: 5, y: 5 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, x: 5, y: 5 });
    assert.equal(await evaluate(`document.querySelector("#memory-lightbox").open`), false);
  });

  await t.test("mobile viewport uses narrow layouts without horizontal overflow", async () => {
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await navigate();
    const state = await evaluate(`(() => ({
      viewport: [innerWidth, innerHeight],
      storyColumns: getComputedStyle(document.querySelector(".story-section")).gridTemplateColumns.split(" ").length,
      galleryColumns: getComputedStyle(document.querySelector(".gallery-group")).gridTemplateColumns.split(" ").length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      mainWidth: document.querySelector("main").getBoundingClientRect().width
    }))()`);
    assert.deepEqual(state.viewport, [390, 844]);
    assert.equal(state.storyColumns, 1);
    assert.equal(state.galleryColumns, 1);
    assert.equal(state.overflow, false);
    assert.ok(state.mainWidth > 0);
  });

  await t.test("disabled JavaScript leaves all content visible with counter fallback", async () => {
    await send("Emulation.setScriptExecutionDisabled", { value: true });
    await navigate();
    const state = await evaluate(`(() => ({
      counter: document.querySelector("#days-count").textContent.trim(),
      revealReady: document.documentElement.classList.contains("reveal-ready"),
      hiddenSections: [...document.querySelectorAll("main > section")].filter((section) => {
        const style = getComputedStyle(section);
        return style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
      }).length
    }))()`);
    assert.equal(state.counter, "Many beautiful days");
    assert.equal(state.revealReady, false);
    assert.equal(state.hiddenSections, 0);
    await send("Emulation.setScriptExecutionDisabled", { value: false });
  });

  await t.test("reduced motion disables reveals, transitions, and smooth scrolling", async () => {
    await send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate();
    await evaluate(`(() => {
      const story = document.querySelector("#story");
      const scrollIntoView = story.scrollIntoView.bind(story);
      window.__storyScrollOptions = null;
      story.scrollIntoView = (options) => {
        window.__storyScrollOptions = options;
        scrollIntoView(options);
      };
    })()`);
    await click(".story-link");
    const state = await evaluate(`(() => ({
      preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
      revealReady: document.documentElement.classList.contains("reveal-ready"),
      opacity: getComputedStyle(document.querySelector(".timeline-entry")).opacity,
      transition: getComputedStyle(document.querySelector(".timeline-entry")).transitionDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      requestedScroll: window.__storyScrollOptions,
      counterInViewport: (() => {
        const rect = document.querySelector("#days-count").getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      })()
    }))()`);
    assert.equal(state.preference, true);
    assert.equal(state.revealReady, false);
    assert.equal(state.opacity, "1");
    assert.equal(state.transition, "0s");
    assert.equal(state.scrollBehavior, "auto");
    assert.deepEqual(state.requestedScroll, { behavior: "auto" });
    assert.equal(state.counterInViewport, true);
  });
});
