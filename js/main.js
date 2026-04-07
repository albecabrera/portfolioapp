/**
 * main.js – Portfolio site logic
 * • Theme toggle   (dark/light, persisted in localStorage)
 * • Language switcher (de/en/es, persisted in localStorage)
 * • Mobile nav menu
 * • Scroll animations (IntersectionObserver)
 * • Active nav link on scroll
 * • Project filter tabs
 * • Contact form validation & submission
 * • Back-to-top button
 * • Sticky header behaviour
 */

"use strict";

/* ─────────────────────────────────────────────────────────────────────────── *
 *  CONSTANTS & STATE
 * ─────────────────────────────────────────────────────────────────────────── */
const STORAGE_THEME = "portfolio-theme";
const STORAGE_LANG  = "portfolio-lang";
const DEFAULT_LANG  = "de";

let currentLang  = localStorage.getItem(STORAGE_LANG)  || DEFAULT_LANG;
let currentTheme = localStorage.getItem(STORAGE_THEME) || "light";

/* ─────────────────────────────────────────────────────────────────────────── *
 *  THEME
 * ─────────────────────────────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_THEME, theme);

  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const isDark = theme === "dark";
  btn.setAttribute("aria-pressed", String(isDark));
  btn.setAttribute("aria-label", isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren");
  btn.title = isDark ? "Hellmodus" : "Dunkelmodus";
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  LANGUAGE / i18n
 * ─────────────────────────────────────────────────────────────────────────── */
function getNestedValue(obj, path) {
  return path.split(".").reduce((cur, key) => (cur && cur[key] !== undefined ? cur[key] : null), obj);
}

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang];
  if (!t) return;

  /* Update all [data-i18n] elements */
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key  = el.getAttribute("data-i18n");
    const text = getNestedValue(t, key);
    if (text !== null) el.textContent = text;
  });

  /* Update meta tags */
  document.documentElement.lang = lang;
  if (t.meta) {
    document.title = t.meta.title;
    setMeta("name",      "description",       t.meta.description);
    setMeta("property",  "og:title",          t.meta.title);
    setMeta("property",  "og:description",    t.meta.description);
    setMeta("name",      "twitter:title",     t.meta.title);
    setMeta("name",      "twitter:description", t.meta.description);
  }

  /* Update language-button aria-pressed states */
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.setAttribute("aria-pressed", String(isActive));
    btn.classList.toggle("active", isActive);
  });

  /* Update select option text (options with data-i18n) */
  document.querySelectorAll("option[data-i18n]").forEach((opt) => {
    const key  = opt.getAttribute("data-i18n");
    const text = getNestedValue(t, key);
    if (text !== null) opt.textContent = text;
  });

  /* Update placeholder attributes */
  updatePlaceholders(lang);

  currentLang = lang;
  localStorage.setItem(STORAGE_LANG, lang);
}

function setMeta(attr, name, content) {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function updatePlaceholders(lang) {
  const placeholders = {
    de: { "contact-name": "Max Mustermann", "contact-email": "max@beispiel.de", "contact-message": "Erzähl mir von deinem Projekt…" },
    en: { "contact-name": "John Doe",        "contact-email": "john@example.com", "contact-message": "Tell me about your project…" },
    es: { "contact-name": "Juan García",     "contact-email": "juan@ejemplo.com", "contact-message": "Cuéntame sobre tu proyecto…" },
  };
  const map = placeholders[lang] || placeholders[DEFAULT_LANG];
  Object.entries(map).forEach(([id, ph]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = ph;
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  MOBILE NAV
 * ─────────────────────────────────────────────────────────────────────────── */
function initMobileNav() {
  const toggle  = document.getElementById("nav-toggle");
  const menu    = document.getElementById("nav-menu");
  const overlay = document.getElementById("nav-overlay");
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add("is-open");
    toggle.classList.add("is-active");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Menü schließen");
    document.body.style.overflow = "hidden";
    overlay && overlay.classList.add("is-visible");
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    toggle.classList.remove("is-active");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
    document.body.style.overflow = "";
    overlay && overlay.classList.remove("is-visible");
  }

  toggle.addEventListener("click", () => {
    menu.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  /* Close when a nav link is clicked */
  menu.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  /* Close on overlay click */
  overlay && overlay.addEventListener("click", closeMenu);

  /* Close on Escape */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  STICKY HEADER
 * ─────────────────────────────────────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    header.classList.toggle("header--scrolled", window.scrollY > 20);
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  ACTIVE NAV LINK ON SCROLL
 * ─────────────────────────────────────────────────────────────────────────── */
function initActiveNavLinks() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav__link");
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  SCROLL-REVEAL ANIMATIONS
 * ─────────────────────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  PROJECT FILTER
 * ─────────────────────────────────────────────────────────────────────────── */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards      = document.querySelectorAll(".project-card");
  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      /* Update button states */
      filterBtns.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });

      /* Show/hide cards */
      cards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.style.display = matches ? "" : "none";
        if (matches) {
          /* Re-trigger animation */
          card.classList.remove("is-visible");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => card.classList.add("is-visible"));
          });
        }
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  CONTACT FORM
 * ─────────────────────────────────────────────────────────────────────────── */
function initContactForm() {
  const form    = document.getElementById("contact-form");
  const success = document.getElementById("form-success");
  const submit  = document.getElementById("form-submit");
  if (!form) return;

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId.replace("contact-", "")}-error`);
    if (field) field.classList.add("has-error");
    if (error) error.textContent = message;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId.replace("contact-", "")}-error`);
    if (field) field.classList.remove("has-error");
    if (error) error.textContent = "";
  }

  /* Live validation */
  ["contact-name", "contact-email", "contact-message"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => clearError(id));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const t    = TRANSLATIONS[currentLang]?.validation || TRANSLATIONS[DEFAULT_LANG].validation;
    const name = document.getElementById("contact-name")?.value.trim()    || "";
    const email = document.getElementById("contact-email")?.value.trim()  || "";
    const msg   = document.getElementById("contact-message")?.value.trim() || "";

    let valid = true;

    if (!name) { showError("contact-name", t.nameRequired); valid = false; }
    else clearError("contact-name");

    if (!email) { showError("contact-email", t.emailRequired); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("contact-email", t.emailInvalid); valid = false; }
    else clearError("contact-email");

    if (!msg) { showError("contact-message", t.messageRequired); valid = false; }
    else clearError("contact-message");

    if (!valid) return;

    /* Simulate sending (replace with your form service – e.g. Formspree)
     * To use Formspree: set form action="https://formspree.io/f/YOUR_ID" method="POST"
     * and remove this JS handler. */
    submit.disabled = true;
    submit.textContent = "…";

    setTimeout(() => {
      form.reset();
      form.hidden       = true;
      success.hidden    = false;
      submit.disabled   = false;

      /* Re-show form after a few seconds so user can send another message */
      setTimeout(() => {
        form.hidden    = false;
        success.hidden = true;
      }, 8000);
    }, 900);
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  BACK TO TOP
 * ─────────────────────────────────────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.hidden = window.scrollY < 400;
  }, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  SMOOTH SCROLLING (polyfill for browsers that don't support it natively)
 * ─────────────────────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById("header")?.offsetHeight || 72;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  HERO ANIMATION STAGGER
 * ─────────────────────────────────────────────────────────────────────────── */
function initHeroAnimations() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    document.querySelectorAll(".animate-fade-up, .animate-fade-left").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }
  document.querySelectorAll(".animate-fade-up").forEach((el, i) => {
    el.style.animationDelay = `${i * 0.1}s`;
  });
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  INIT
 * ─────────────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  /* Apply saved or default preferences FIRST to prevent flash */
  applyTheme(currentTheme);
  applyTranslations(currentLang);

  /* Wire up theme toggle */
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

  /* Wire up language buttons */
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyTranslations(btn.dataset.lang));
  });

  /* Init all modules */
  initMobileNav();
  initStickyHeader();
  initActiveNavLinks();
  initScrollReveal();
  initProjectFilter();
  initContactForm();
  initBackToTop();
  initSmoothScroll();
  initHeroAnimations();
});
