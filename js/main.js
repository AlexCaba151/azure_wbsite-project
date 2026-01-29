// Main JavaScript file

// Current language
let currentLanguage = localStorage.getItem("language") || "en";

// DOM Ready
document.addEventListener("DOMContentLoaded", function () {
  initLanguage();
  initMobileMenu();
  initLanguageSwitcher();
  initContactForm();
  updatePageContent();
});

// Initialize language from localStorage
function initLanguage() {
  currentLanguage = localStorage.getItem("language") || "en";
  document.documentElement.lang = currentLanguage;
}

// Get translation by path
function t(path) {
  const keys = path.split(".");
  let value = translations?.[currentLanguage];

  for (const key of keys) {
    if (value && value[key] !== undefined) {
      value = value[key];
    } else {
      // Fallback to English
      value = translations?.["en"];
      for (const k of keys) {
        if (value && value[k] !== undefined) {
          value = value[k];
        } else {
          return path;
        }
      }
      break;
    }
  }

  return value;
}

// Mobile Menu
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", function () {
      this.classList.toggle("active");
      mobileMenu.classList.toggle("show");
    });

    // Close menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll(".nav-link");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", function () {
        mobileMenuBtn.classList.remove("active");
        mobileMenu.classList.remove("show");
      });
    });
  }
}

// Language Switcher (desktop + mobile)
function initLanguageSwitcher() {
  const switchers = document.querySelectorAll(".language-switcher");

  switchers.forEach((sw) => {
    const languageBtn = sw.querySelector(".language-btn");
    const languageDropdown = sw.querySelector(".language-dropdown");
    const languageOptions = sw.querySelectorAll(".language-option");

    if (!languageBtn || !languageDropdown) return;

    // Toggle dropdown
    languageBtn.addEventListener("click", function (e) {
      e.stopPropagation();

      // Close other open dropdowns
      document.querySelectorAll(".language-dropdown.show").forEach((dd) => {
        if (dd !== languageDropdown) dd.classList.remove("show");
      });

      languageDropdown.classList.toggle("show");
    });

    // Language selection
    languageOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.stopPropagation();
        const lang = this.dataset.lang;
        setLanguage(lang);
        languageDropdown.classList.remove("show");
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function () {
    document.querySelectorAll(".language-dropdown.show").forEach((dd) => dd.classList.remove("show"));
  });

  // Update language button text + active option
  updateLanguageButton();
  updateActiveLanguageOption();
}

// Set language
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
  updatePageContent();
  updateLanguageButton();
  updateActiveLanguageOption();
}

// Update language button text (desktop + mobile)
function updateLanguageButton() {
  document.querySelectorAll(".language-btn-text").forEach((el) => {
    el.textContent = currentLanguage === "en" ? "EN" : "ES";
  });
}

// Update active language option (both menus)
function updateActiveLanguageOption() {
  document.querySelectorAll(".language-option").forEach((option) => {
    option.classList.toggle("active", option.dataset.lang === currentLanguage);
  });
}

// Update page content based on current language
function updatePageContent() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translation = t(key);

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      if (el.hasAttribute("placeholder")) el.placeholder = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Update elements with data-i18n-placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

  // Update navigation links
  updateNavigation();

  // Update active language option
  updateActiveLanguageOption();
}

// Update navigation
function updateNavigation() {
  document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
    const navKey = link.getAttribute("data-nav");
    link.textContent = t(`nav.${navKey}`);
  });
}

// Contact Form
function initContactForm() {
  const form = document.getElementById("contact-form");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleFormSubmit(form);
    });
  }
}

// Handle form submission
async function handleFormSubmit(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!submitBtn) return;

  const originalText = submitBtn.innerHTML;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span> ${t("contactPage.form.sending")}`;

  // Simulate form submission
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get form data
  const formData = new FormData(form);
  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    service: formData.get("service"),
    message: formData.get("message"),
  };

  console.log("Form submitted:", data);

  // Reset button
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalText;

  // Show success modal
  showSuccessModal(data.name, data.service);

  // Reset form
  form.reset();

  // Show toast (tu translations.js lo tiene aquí)
  showToast(t("contactPage.success.title"));
}

// Show success modal
function showSuccessModal(name, service) {
  const modal = document.getElementById("success-modal");
  if (!modal) return;

  const nameSpan = modal.querySelector(".modal-name");
  const serviceSpan = modal.querySelector(".modal-service");
  if (nameSpan) nameSpan.textContent = name || "";
  if (serviceSpan) serviceSpan.textContent = service || "";

  modal.classList.add("show");

  const closeBtn = modal.querySelector(".modal-close");
  const continueBtn = modal.querySelector(".modal-continue");

  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("show"));
  if (continueBtn) continueBtn.addEventListener("click", () => modal.classList.remove("show"));

  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.classList.remove("show");
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  const toastMessage = toast.querySelector(".toast-message");
  if (toastMessage) toastMessage.textContent = message;

  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 5000);

  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) closeBtn.addEventListener("click", () => toast.classList.remove("show"));
}
