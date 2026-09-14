"use strict";

function calculateDaysTogether(startDate, currentDate) {
  if (
    Object.prototype.toString.call(startDate) !== "[object Date]" ||
    Object.prototype.toString.call(currentDate) !== "[object Date]" ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(currentDate.getTime())
  ) {
    return null;
  }

  const normalizedStart = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const normalizedCurrent = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );

  if (normalizedStart > normalizedCurrent) {
    return null;
  }

  return Math.floor((normalizedCurrent - normalizedStart) / 86400000);
}

function formatDaysTogether(days) {
  return Number.isInteger(days) && days >= 0
    ? days.toLocaleString("en-US")
    : "Many beautiful days";
}

function initializeScrapbook() {
  const reducedMotion =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };
  const daysCount = document.getElementById("days-count");
  const storyLink = document.querySelector(".story-link");
  const story = document.getElementById("story");

  if (daysCount) {
    const startDate = new Date(2020, 0, 1);
    daysCount.textContent = formatDaysTogether(calculateDaysTogether(startDate, new Date()));
  }

  if (storyLink && story) {
    storyLink.addEventListener("click", (event) => {
      event.preventDefault();
      story.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    });
  }

  const revealElements = document.querySelectorAll(
    ".timeline-entry, .gallery-group, .memory-notes, .letter",
  );

  if (!reducedMotion.matches && "IntersectionObserver" in window && revealElements.length) {
    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    for (const element of revealElements) {
      observer.observe(element);
    }
  }

  const galleryCards = [...document.querySelectorAll(".gallery-card")];
  const lightbox = document.getElementById("memory-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeButton = document.getElementById("lightbox-close");
  const previousButton = document.getElementById("lightbox-previous");
  const nextButton = document.getElementById("lightbox-next");

  if (
    !galleryCards.length ||
    !lightbox ||
    !lightboxImage ||
    !lightboxCaption ||
    !closeButton ||
    !previousButton ||
    !nextButton ||
    typeof lightbox.showModal !== "function"
  ) {
    return;
  }

  let currentIndex = 0;
  let previouslyFocused = null;

  function showMemory(index) {
    currentIndex = (index + galleryCards.length) % galleryCards.length;
    const card = galleryCards[currentIndex];
    const thumbnail = card.querySelector("img");

    lightboxImage.src = card.dataset.full;
    lightboxImage.alt = thumbnail?.alt || "";
    lightboxCaption.textContent = card.dataset.caption;
  }

  function openLightbox(index) {
    previouslyFocused = document.activeElement;
    showMemory(index);
    lightbox.showModal();
    closeButton.focus();
  }

  function closeLightbox() {
    if (lightbox.open) {
      lightbox.close();
    }
  }

  function restoreFocus() {
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  }

  galleryCards.forEach((card, index) => {
    card.addEventListener("click", () => openLightbox(index));
  });

  closeButton.addEventListener("click", closeLightbox);
  previousButton.addEventListener("click", () => showMemory(currentIndex - 1));
  nextButton.addEventListener("click", () => showMemory(currentIndex + 1));
  lightbox.addEventListener("close", restoreFocus);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showMemory(currentIndex - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showMemory(currentIndex + 1);
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = [...lightbox.querySelectorAll("button:not([disabled])")];
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initializeScrapbook);
}
