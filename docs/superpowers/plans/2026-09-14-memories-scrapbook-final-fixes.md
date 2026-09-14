# Memories Scrapbook Final Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all final-review accessibility, content, clipping, and browser-test gaps in one verified fix wave.

**Architecture:** Extend the existing CDP browser suite to reproduce user-visible regressions against the direct `file://` page, then make minimal changes to the lightbox state, artwork descriptions, and close-button positioning. Keep static contract coverage only where it complements real browser behavior.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, local SVG, Node.js built-in test runner, Chrome DevTools Protocol

**Spec:** `docs/superpowers/specs/2026-09-14-memories-scrapbook-design.md`

## Global Constraints

- The website must continue to run directly from a `file://` URL without network access or a build step.
- Lightbox focus must return to the gallery item selected for the current opening.
- Image failures must preserve useful alternative text and the surrounding caption.
- The close control must remain fully within the scrollable dialog and retain a 2.75rem target.
- Do not dispatch subagents.

---

### Task 1: Browser Regressions and Minimal Fixes

**Files:**
- Modify: `asset/js/browser.test.js`
- Modify: `asset/js/script.test.js`
- Modify: `asset/js/script.js`
- Modify: `asset/style/style.css`
- Modify: `index.html`
- Modify: `asset/images/memory-coffee.svg`
- Create: `.superpowers/sdd/2026-09-14-memories-scrapbook/final-fix-report.md`

**Interfaces:**
- Consumes: existing `.gallery-card` controls and `#memory-lightbox` dialog
- Produces: exact selected-card focus restoration, contained close-button geometry, accurate coffee descriptions, and direct-file error/fallback coverage

- [ ] **Step 1: Add failing regression tests**

Add real-browser assertions that programmatically activate a gallery card while focus is elsewhere and verify focus returns to that exact card, that the close button's target rectangle is at least 44px and remains inside the dialog content, and that a failed gallery image retains non-empty useful alt text plus a visible caption. Collect `Runtime.exceptionThrown`, error-level `Runtime.consoleAPICalled`, and error-level `Log.entryAdded` events during direct-file loading. Add static contracts for the corrected coffee description and inset close-button offsets.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern='lightbox|coffee' asset/js/script.test.js asset/js/browser.test.js`

Expected: FAIL because focus returns to ambient focus, coffee descriptions claim two cups, and the close button extends beyond the content bounds.

- [ ] **Step 3: Implement minimal production changes**

Set the lightbox restoration target from `galleryCards[index]`, change the HTML alt and SVG description to one cup beside an open book, and replace negative close-button offsets with inset values while retaining the existing minimum height.

- [ ] **Step 4: Run focused and full verification**

Run focused browser/static tests, the complete Node suite, JavaScript and HTML syntax checks, and `git diff --check`. Record exact commands and outputs in the final report.

- [ ] **Step 5: Self-review and commit**

Review the diff for spec coverage, test integrity, accidental changes, and unresolved concerns. Commit all implementation, tests, planning, and report artifacts in one commit.
