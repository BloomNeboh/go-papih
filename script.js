const THEME_KEY = "luminaverse-theme";
const STANDARD_THEME_KEY = "luminaverse-standard-theme";
const themes = {
  safari: "safari",
  dark: "dark",
  luminaverse: "luminaverse",
};

const root = document.documentElement;
const body = document.body;
const pageLoader = document.querySelector(".page-loader");
const themeButtons = document.querySelectorAll("[data-theme-toggle]");
const themeSwitch = document.querySelector("[data-theme-switch]");
const typewriterEl = document.getElementById("typewriter");
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const currentYearEl = document.getElementById("currentYear");

let currentStandardTheme = localStorage.getItem(STANDARD_THEME_KEY) || themes.safari;

function applyTheme(theme) {
  const nextTheme = themes[theme] ? theme : themes.safari;
  root.setAttribute("data-theme", nextTheme);
  body.setAttribute("data-theme", nextTheme);
  themeButtons.forEach((btn) => {
    const isActive = btn.dataset.themeToggle === nextTheme;
    btn.setAttribute("aria-pressed", String(isActive));
  });
  if (themeSwitch) {
    if (nextTheme === themes.dark || nextTheme === themes.safari) {
      themeSwitch.setAttribute("data-mode", nextTheme === themes.dark ? themes.dark : themes.safari);
      themeSwitch.setAttribute("aria-pressed", String(nextTheme === themes.dark));
    } else {
      themeSwitch.setAttribute("data-mode", currentStandardTheme);
      themeSwitch.setAttribute("aria-pressed", "false");
    }
  }
  localStorage.setItem(THEME_KEY, nextTheme);
  if (nextTheme === themes.dark || nextTheme === themes.safari) {
    currentStandardTheme = nextTheme;
    localStorage.setItem(STANDARD_THEME_KEY, currentStandardTheme);
  }
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored && themes[stored]) {
    applyTheme(stored);
  } else {
    applyTheme(currentStandardTheme);
  }
}

function handleThemeToggle() {
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.themeToggle;
      applyTheme(theme);
      animateThemeTransition();
    });
  });

  if (themeSwitch) {
    themeSwitch.addEventListener("click", () => {
      const nextTheme = currentStandardTheme === themes.safari ? themes.dark : themes.safari;
      applyTheme(nextTheme);
      animateThemeTransition();
    });
  }
}

function animateThemeTransition() {
  body.classList.add("theme-transition");
  setTimeout(() => {
    body.classList.remove("theme-transition");
  }, 500);
}

function initTypewriter() {
  if (!typewriterEl) return;
  const text = typewriterEl.dataset.text || "";
  const characters = text.split("");
  typewriterEl.textContent = "";
  let index = 0;
  const typingSpeed = 80;

  const interval = setInterval(() => {
    if (index < characters.length) {
      typewriterEl.textContent += characters[index];
      index += 1;
    } else {
      clearInterval(interval);
    }
  }, typingSpeed);
}

function initIntersectionObserver() {
  const elements = document.querySelectorAll("[data-animate]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  elements.forEach((el) => observer.observe(el));
}

function initTimelineAnimation() {
  const timeline = document.querySelector("#experience .timeline");
  if (!timeline) return;

  const items = Array.from(timeline.querySelectorAll(".timeline-item"));
  if (!items.length) return;

  const updateProgress = () => {
    const viewportHeight = window.innerHeight;
    const timelineRect = timeline.getBoundingClientRect();
    const totalHeight = timelineRect.height;

    let visibleIndex = -1;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const visibilityThreshold = Math.min(viewportHeight * 0.6, viewportHeight - 120);
      if (rect.top < visibilityThreshold) {
        visibleIndex = index;
      }
    });

    const progress = visibleIndex >= 0 ? (visibleIndex + 1) / items.length : 0;
    timeline.style.setProperty("--timeline-progress", progress);
  };

  const handleScroll = () => {
    window.requestAnimationFrame(updateProgress);
  };

  updateProgress();
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);
}

function validateFormField(field) {
  if (!field) return false;
  if (!field.value.trim()) {
    field.setAttribute("aria-invalid", "true");
    return false;
  }
  if (field.type === "email") {
    const pattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!pattern.test(field.value.trim())) {
      field.setAttribute("aria-invalid", "true");
      return false;
    }
  }
  field.removeAttribute("aria-invalid");
  return true;
}

async function handleContactForm() {
  if (!contactForm || !formStatus) return;
  const submitButton = contactForm.querySelector("[data-submit-button]");

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "";
    formStatus.classList.remove("success", "error");

    const nameField = contactForm.querySelector("#name");
    const emailField = contactForm.querySelector("#email");
    const messageField = contactForm.querySelector("#message");

    const validName = validateFormField(nameField);
    const validEmail = validateFormField(emailField);
    const validMessage = validateFormField(messageField);

    if (!validName || !validEmail || !validMessage) {
      formStatus.textContent = "Please complete all required fields with valid information.";
      formStatus.classList.add("error");
      return;
    }

    const formEndpoint = "https://formspree.io/f/maykgeko";
    const payload = {
      name: nameField.value.trim(),
      email: emailField.value.trim(),
      message: messageField.value.trim(),
    };

    formStatus.textContent = "Sending…";
    formStatus.classList.add("pending");
    submitButton?.setAttribute("disabled", "true");

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      formStatus.textContent = "Message delivered! I’ll get back to you shortly.";
      formStatus.classList.remove("pending");
      formStatus.classList.add("success");
      contactForm.reset();
    } catch (error) {
      formStatus.textContent = "Something went wrong. Please try again in a moment.";
      formStatus.classList.remove("pending");
      formStatus.classList.add("error");
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}

function updateCurrentYear() {
  if (currentYearEl) {
    currentYearEl.textContent = String(new Date().getFullYear());
  }
}

function initAccessibilityHelpers() {
  document.addEventListener("keyup", (event) => {
    if (event.key === "Tab") {
      body.classList.add("user-tabbed");
    }
  });
}

function removeLoader() {
  window.addEventListener("load", () => {
    body.dataset.loaded = "true";
    setTimeout(() => {
      pageLoader?.remove();
    }, 400);
  });
}

function initParallax() {
  const heroBackground = document.querySelector(".hero-background");
  if (!heroBackground) return;
  window.addEventListener("scroll", () => {
    const offset = window.scrollY * 0.2;
    heroBackground.style.transform = `translateY(${offset}px)`;
  });
}

function initParticleToggle() {
  const particleField = document.querySelector(".particle-field");
  if (!particleField) return;
  const handleParticleVisibility = () => {
    const theme = body.getAttribute("data-theme");
    particleField.style.opacity = theme === themes.luminaverse ? "1" : "0";
  };
  handleParticleVisibility();
  const observer = new MutationObserver(handleParticleVisibility);
  observer.observe(body, { attributes: true, attributeFilter: ["data-theme"] });
}

function init() {
  loadTheme();
  handleThemeToggle();
  initTypewriter();
  initIntersectionObserver();
  handleContactForm();
  updateCurrentYear();
  initAccessibilityHelpers();
  removeLoader();
  initParallax();
  initParticleToggle();
  initTimelineAnimation();

  // Inform developers to configure Formspree endpoint
  if (!document.querySelector("[data-submit-button]")) {
    console.warn("Contact form submit button not found. Check markup.");
  }
}

document.addEventListener("DOMContentLoaded", init);
