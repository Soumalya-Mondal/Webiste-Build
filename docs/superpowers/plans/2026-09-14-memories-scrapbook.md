# Memories Scrapbook Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, accessible, one-page memories scrapbook that runs by opening `index.html` directly.

**Architecture:** `index.html` provides all semantic content and no-JavaScript fallbacks, `asset/style/style.css` owns the warm scrapbook presentation and responsive behavior, and `asset/js/script.js` progressively adds the counter, reveals, smooth navigation, and accessible lightbox. Local SVG placeholder artwork under `asset/images/` keeps the site self-contained and easy to customize.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, local SVG images, Node.js built-in test runner for source-level checks

**Spec:** `docs/superpowers/specs/2026-09-14-memories-scrapbook-design.md`

## Global Constraints

- The website must run from a `file://` URL without a server, package manager, framework, build step, or network connection.
- The website root contains only `index.html`; website assets live under `asset/images/`, `asset/style/`, and `asset/js/`.
- Names, dates, captions, and images use clearly replaceable placeholders.
- Core content remains visible and readable when JavaScript is disabled.
- Motion must honor `prefers-reduced-motion`.
- Interactive controls must support keyboards and visible focus.

---

### Task 1: Semantic Story and Local Artwork

**Files:**
- Create: `index.html`
- Create: `asset/images/memory-first-meeting.svg`
- Create: `asset/images/memory-road-trip.svg`
- Create: `asset/images/memory-celebration.svg`
- Create: `asset/images/memory-coffee.svg`
- Create: `asset/images/memory-sunset.svg`
- Create: `asset/images/memory-home.svg`
- Create: `asset/js/script.test.js`

**Interfaces:**
- Consumes: None
- Produces: semantic IDs `story`, `timeline`, `gallery`, and `love-note`; gallery buttons with `.gallery-card`, `data-full`, and `data-caption`; lightbox elements identified by `memory-lightbox`, `lightbox-image`, `lightbox-caption`, `lightbox-close`, `lightbox-previous`, and `lightbox-next`

- [ ] **Step 1: Write failing structure tests**

Create Node tests that read `index.html` and assert it references `asset/style/style.css` and `asset/js/script.js`, includes all required section IDs, supplies a fallback value in `#days-count`, and maps every gallery `data-full` path to an existing local file. Assert that no `http://` or `https://` asset references exist.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test asset/js/script.test.js`

Expected: FAIL because `index.html` and local memory images do not exist.

- [ ] **Step 3: Add semantic page content and artwork**

Create `index.html` with a skip link, header/hero, days-together card, timeline, grouped gallery, favorite-memory notes, closing letter, footer, and initially hidden dialog. Use buttons for gallery thumbnails and lightbox controls. Add six distinct local SVG illustrations with descriptive titles and stable `viewBox` dimensions.

- [ ] **Step 4: Run the structure tests**

Run: `node --test asset/js/script.test.js`

Expected: PASS for structure, paths, fallbacks, and local-only assets.

- [ ] **Step 5: Commit the semantic site shell**

```bash
git add index.html asset/images asset/js/script.test.js
git commit -m "feat: add scrapbook content and local artwork"
```

### Task 2: Responsive Scrapbook Presentation

**Files:**
- Create: `asset/style/style.css`
- Modify: `asset/js/script.test.js`

**Interfaces:**
- Consumes: classes and IDs from `index.html`
- Produces: desktop and mobile layouts, paper and tape treatments, timeline and gallery compositions, lightbox presentation, `.reveal-ready`/`.is-visible` enhancement states, focus styles, and reduced-motion overrides

- [ ] **Step 1: Extend tests for presentation contracts**

Add assertions that `style.css` contains a narrow-screen media query, a `prefers-reduced-motion: reduce` query, `:focus-visible` styling, lightbox styling, and rules that hide reveal elements only beneath the JavaScript-added `.reveal-ready` class.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test asset/js/script.test.js`

Expected: FAIL because `asset/style/style.css` does not exist.

- [ ] **Step 3: Implement the complete visual system**

Define palette and spacing custom properties, layered paper backgrounds, readable local font stacks, decorative scrapbook details, responsive timeline cards, occasion-based gallery grids, note cards, controls, dialog/backdrop styling, and mobile breakpoints. Keep content visible before `.reveal-ready` is attached and remove transforms, transitions, animations, and smooth scrolling for reduced motion.

- [ ] **Step 4: Run the presentation tests**

Run: `node --test asset/js/script.test.js`

Expected: PASS for all structure and CSS contracts.

- [ ] **Step 5: Commit the responsive design**

```bash
git add asset/style/style.css asset/js/script.test.js
git commit -m "feat: style responsive scrapbook layout"
```

### Task 3: Counter, Reveals, and Accessible Lightbox

**Files:**
- Create: `asset/js/script.js`
- Modify: `asset/js/script.test.js`

**Interfaces:**
- Consumes: gallery and lightbox element IDs from Task 1 and reveal classes from Task 2
- Produces: `calculateDaysTogether(startDate, currentDate): number | null`, `formatDaysTogether(days): string`, and browser initialization on `DOMContentLoaded`

- [ ] **Step 1: Add failing JavaScript behavior tests**

Use Node's `vm` module to load `script.js` without a browser and assert that `calculateDaysTogether(new Date(2020, 0, 1), new Date(2020, 0, 2))` returns `1`, same-day input returns `0`, a future or invalid start date returns `null`, and `formatDaysTogether(null)` returns `Many beautiful days`. Add source assertions for `IntersectionObserver`, `prefers-reduced-motion`, `Escape`, `ArrowLeft`, `ArrowRight`, focus restoration, and dialog focus trapping.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test asset/js/script.test.js`

Expected: FAIL because `asset/js/script.js` does not exist.

- [ ] **Step 3: Implement progressive enhancements**

Define the placeholder start date with the local constructor `new Date(2020, 0, 1)`. Implement calendar-day calculation using normalized local dates, safe counter formatting, reduced-motion-aware smooth navigation, guarded `IntersectionObserver` reveals, gallery index management, dialog opening and closing, cyclic previous/next navigation, backdrop dismissal, focus trapping, keyboard commands, and focus restoration. Guard DOM startup with `typeof document !== "undefined"` so pure functions remain testable in Node.

- [ ] **Step 4: Run automated verification**

Run: `node --test asset/js/script.test.js`

Expected: PASS for all HTML, CSS, asset, pure-function, and source-contract tests.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 5: Perform browser verification**

Open `index.html` directly and verify at desktop and mobile widths: all images load; `Start Our Story` reaches the counter; the counter contains an integer; gallery buttons open the matching caption; previous, next, `Escape`, backdrop click, and focus restoration work; keyboard focus is visible; disabling JavaScript leaves all page sections readable; reduced-motion emulation removes reveals and smooth movement.

- [ ] **Step 6: Commit the finished interactions**

```bash
git add asset/js/script.js asset/js/script.test.js
git commit -m "feat: add scrapbook interactions"
```
