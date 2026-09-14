const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");

const projectRoot = resolve(__dirname, "../..");
const htmlPath = resolve(projectRoot, "index.html");

function readPage() {
  return readFileSync(htmlPath, "utf8");
}

test("page links the local stylesheet and script", () => {
  const html = readPage();

  assert.match(html, /<link[^>]+href=["']asset\/style\/style\.css["']/i);
  assert.match(html, /<script[^>]+src=["']asset\/js\/script\.js["'][^>]*>/i);
});

test("page exposes the semantic section contracts", () => {
  const html = readPage();

  for (const id of ["story", "timeline", "gallery", "love-note"]) {
    assert.match(html, new RegExp(`<section[^>]+id=["']${id}["']`, "i"));
  }
});

test("days counter has readable fallback content", () => {
  const html = readPage();
  const counter = html.match(/<[^>]+id=["']days-count["'][^>]*>([^<]+)</i);

  assert.ok(counter, "expected a #days-count element with text content");
  assert.ok(counter[1].trim(), "expected #days-count fallback text not to be empty");
});

test("every gallery card points to an existing local image", () => {
  const html = readPage();
  const cards = [...html.matchAll(/<button\b[^>]*class=["'][^"']*\bgallery-card\b[^"']*["'][^>]*>/gi)];

  assert.ok(cards.length > 0, "expected at least one gallery card");
  for (const [tag] of cards) {
    const fullPath = tag.match(/\bdata-full=["']([^"']+)["']/i)?.[1];
    const caption = tag.match(/\bdata-caption=["']([^"']+)["']/i)?.[1];

    assert.ok(fullPath, "expected each gallery card to have data-full");
    assert.ok(caption?.trim(), "expected each gallery card to have data-caption");
    assert.ok(!/^(?:https?:)?\/\//i.test(fullPath), `expected local gallery path, got ${fullPath}`);
    assert.ok(existsSync(resolve(projectRoot, fullPath)), `missing gallery image: ${fullPath}`);
  }
});

test("page does not reference remote assets", () => {
  const html = readPage();
  const assetReferences = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map(
    (match) => match[1],
  );

  assert.equal(
    assetReferences.filter((reference) => /^https?:\/\//i.test(reference)).length,
    0,
  );
});
