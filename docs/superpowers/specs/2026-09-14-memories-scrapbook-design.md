# Memories Scrapbook Website Design

## Purpose

Build a warm, personal one-page website for preserving memories with the user's wife. The page will combine a chronological relationship timeline with photo groups organized by occasion. The initial version will use tasteful placeholder names, dates, captions, and local images that can be replaced later.

The site must work by opening `index.html` directly from the filesystem. It will not require a web server, package manager, framework, build step, or network connection.

## Project Structure

The deliverable will use this structure:

```text
Website-Build/
├── index.html
└── asset/
    ├── images/
    │   └── placeholder images
    ├── style/
    │   └── style.css
    └── js/
        └── script.js
```

Only `index.html` will be present at the project root as part of the website. Project documentation and Git metadata are development artifacts rather than website pages.

## Visual Direction

The page will use a warm scrapbook aesthetic:

- Cream and paper-inspired backgrounds
- Soft brown, muted terracotta, sage, and faded rose accents
- A readable serif typeface with handwritten-style accents provided through local/system font fallbacks
- Layered paper cards, tape details, lightly rotated photographs, soft shadows, and restrained doodles
- Gentle motion that adds warmth without distracting from the memories

The design will remain legible and cohesive rather than reproducing the clutter of a physical scrapbook. It will adapt from a richer desktop composition to a clear single-column mobile layout.

## Page Structure

### Hero

The hero will resemble a scrapbook cover and contain placeholder couple names, a short romantic introduction, and a `Start Our Story` link that scrolls to the first memory section.

### Days Together

A highlighted paper card will display the number of days since a clearly labeled placeholder relationship start date. The date will be defined in `asset/js/script.js` so it can be changed easily.

### Our Timeline

The relationship story will be presented through alternating milestone cards on desktop and a single vertical sequence on mobile. Placeholder milestones will include examples such as the first meeting, first trip, and an anniversary. Each milestone will have a date, title, short caption, and optional image.

### Memory Gallery

Local placeholder photographs will be arranged in responsive scrapbook clusters grouped under occasions such as:

- Adventures
- Celebrations
- Everyday moments

Selecting a photo will open an accessible lightbox. Users can close it, move to the previous or next image, click outside to dismiss it, and use keyboard controls. Captions will remain associated with their images.

### Favorite Memories

Short placeholder memories will appear as handwritten note cards. This section provides space for small personal moments that do not need full timeline entries.

### Closing Note

The page will end with a letter-style placeholder love note and a simple footer.

## Interaction Design

JavaScript will provide progressive enhancements:

- Smooth in-page navigation
- Scroll-triggered reveal animations using `IntersectionObserver`
- A live days-together calculation based on local calendar dates
- An image lightbox with previous, next, close, backdrop, and keyboard interactions
- Focus restoration to the selected gallery item after the lightbox closes

The core content will remain readable when JavaScript is disabled. Reveal content will be visible by default and enhanced only after JavaScript initializes. The lightbox will not be required to view the gallery thumbnails and captions.

## Accessibility

The implementation will use semantic landmarks, a logical heading hierarchy, descriptive placeholder alternative text, visible keyboard focus styles, and real buttons for interactive controls. The lightbox will expose appropriate dialog semantics, provide an accessible name, trap focus while open, restore focus when closed, and respond to `Escape`, `ArrowLeft`, and `ArrowRight`.

The site will honor `prefers-reduced-motion` by removing nonessential transitions, transforms, and smooth scrolling. Text and controls will maintain readable contrast against paper-style backgrounds.

## Responsive Behavior

The desktop page will use layered compositions, alternating timeline cards, and multi-column photo clusters. At narrower widths, sections will become single-column, decorative rotations will be reduced, and interactive targets will remain comfortably sized. Images will use responsive dimensions and stable aspect ratios to avoid layout shifts.

## Assets and Failure Handling

Placeholder images will be stored under `asset/images/`; the page will not depend on remote image services. Lightweight SVG illustrations are suitable because they remain sharp, compact, and easy to replace. If an image cannot load, its alternative text and surrounding caption will preserve the meaning of the memory.

The counter will render a neutral fallback label in HTML before JavaScript calculates the value. Invalid date configuration will produce a safe fallback rather than displaying `NaN`.

## Verification

Verification will cover:

- Opening `index.html` through a `file://` URL without console-breaking module or network dependencies
- Correct project structure and relative asset paths
- Desktop and mobile layouts
- In-page navigation and visible focus states
- Correct days-together calculation for the configured local date
- Lightbox opening, closing, previous/next navigation, backdrop behavior, and keyboard controls
- Focus trapping and restoration in the lightbox
- Content visibility when JavaScript is disabled
- Reduced-motion behavior
- Graceful presentation if a placeholder image is unavailable

## Out of Scope

The first version will not include content editing, uploads, authentication, a database, background music, floating hearts, gallery filters, social sharing, deployment configuration, analytics, or additional HTML pages.
