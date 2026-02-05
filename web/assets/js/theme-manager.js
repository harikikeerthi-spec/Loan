/**
 * Theme Manager - Shared theme switching and setup
 * Used by both public and admin sites
 */
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupThemeToggle();
    this.watchSystemPreference();
  }

  applyTheme(theme) {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', theme);
    this.currentTheme = theme;
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  setupThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggle());
      // Update button label
      this.updateThemeButtonLabel(toggleButton);
      window.addEventListener('themeChanged', () => {
        this.updateThemeButtonLabel(toggleButton);
      });
    }
  }

  updateThemeButtonLabel(button) {
    if (this.currentTheme === 'dark') {
      button.textContent = '☀️ Light';
      button.title = 'Switch to light mode';
    } else {
      button.textContent = '🌙 Dark';
      button.title = 'Switch to dark mode';
    }
  }

  watchSystemPreference() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addListener((e) => {
        if (localStorage.getItem('theme') === null) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
}

/**
 * Reusable Component Library
 * Shared across public and admin sites
 */
class ComponentLibrary {
  static createBadge(text, variant = 'primary', size = 'sm') {
    const variantClasses = {
      primary: 'bg-primary text-white',
      secondary: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    };

    const sizeClasses = {
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-1.5 text-base',
    };

    const baseClasses = 'inline-block rounded-full font-medium';
    return `<span class="${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.sm}">${text}</span>`;
  }

  static createButton(text, options = {}) {
    const {
      variant = 'primary',
      size = 'md',
      disabled = false,
      onClick = null,
      className = '',
    } = options;

    const variantClasses = {
      primary: 'bg-primary hover:bg-primary-dark text-white disabled:opacity-50',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50',
      danger: 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-50',
      outline: 'border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50',
    };

    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const baseClasses = 'inline-block rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed';
    const onClickAttr = onClick ? `onclick="${onClick}"` : '';
    const disabledAttr = disabled ? 'disabled' : '';

    return `
      <button
        class="${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}"
        ${disabledAttr}
        ${onClickAttr}
      >
        ${text}
      </button>
    `;
  }

  static createCard(title, content, options = {}) {
    const { imageSrc = null, footer = null, className = '' } = options;

    const imageHtml = imageSrc ? `<img src="${imageSrc}" class="w-full h-48 object-cover" alt="Card image" />` : '';
    const footerHtml = footer ? `<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">${footer}</div>` : '';

    return `
      <div class="glass-card rounded-lg overflow-hidden ${className}">
        ${imageHtml}
        <div class="p-6">
          <h3 class="text-xl font-bold text-primary">${title}</h3>
          <div class="mt-3 text-gray-600 dark:text-gray-300">${content}</div>
          ${footerHtml}
        </div>
      </div>
    `;
  }

  static createModal(id, title, content, options = {}) {
    const { onClose = null, showFooter = true } = options;

    const closeBtn = onClose ? `onclick="${onClose}"` : `onclick="document.getElementById('${id}').style.display='none'"`;
    const footerHtml = showFooter
      ? `
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button class="btn btn-secondary btn-sm" ${closeBtn}>Close</button>
          <button class="btn btn-primary btn-sm" onclick="console.log('Confirm clicked')">Confirm</button>
        </div>
      `
      : '';

    return `
      <div id="${id}" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="glass-card rounded-lg max-w-md w-full mx-4">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold">${title}</h2>
              <button class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" ${closeBtn}>✕</button>
            </div>
            <div class="text-gray-600 dark:text-gray-300">${content}</div>
            ${footerHtml}
          </div>
        </div>
      </div>
    `;
  }

  static createAlert(text, variant = 'info', dismissible = true) {
    const variantClasses = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border border-green-300 dark:border-green-700',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border border-red-300 dark:border-red-700',
    };

    const closeBtn = dismissible ? '<button class="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" onclick="this.parentElement.remove()">✕</button>' : '';

    return `
      <div class="alert rounded-lg p-4 flex items-center gap-3 ${variantClasses[variant] || variantClasses.info}">
        <span>${text}</span>
        ${closeBtn}
      </div>
    `;
  }
}

/**
 * Utility functions for common operations
 */
class UIUtils {
  static showElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.style.display = '');
  }

  static hideElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.style.display = 'none');
  }

  static toggleElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    });
  }

  static addClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add(className));
  }

  static removeClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove(className));
  }

  static toggleClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.toggle(className));
  }
}

// Export to window
window.ThemeManager = ThemeManager;
window.ComponentLibrary = ComponentLibrary;
window.UIUtils = UIUtils;

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  const themeManager = new ThemeManager();
  themeManager.init();
  window.themeManager = themeManager;
});
