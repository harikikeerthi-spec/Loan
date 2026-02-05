/**
 * Component Loader
 * Loads navbar and footer components into pages
 */

(function () {
    'use strict';

    // Load component from file
    async function loadComponent(componentName, targetId) {
        try {
            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}: ${response.statusText}`);
            }
            const html = await response.text();
            const target = document.getElementById(targetId);
            if (target) {
                target.innerHTML = html;
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    }

    // Load all components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }

    async function initComponents() {
        // Load navbar and footer in parallel
        await Promise.all([
            loadComponent('navbar', 'navbar-placeholder'),
            loadComponent('footer', 'footer-placeholder')
        ]);

        // After components are loaded, initialize any scripts that depend on them
        initializeComponentScripts();
    }

    function initializeComponentScripts() {
        // Initialize navigation scroll effect
        const nav = document.getElementById('mainNav');
        if (nav) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    nav.classList.add('nav-scrolled');
                } else {
                    nav.classList.remove('nav-scrolled');
                }
            });
        }

        // Initialize profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                    profileDropdown.classList.add('hidden');
                }
            });

            // Prevent dropdown from closing when clicking inside it
            profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Check if user is logged in and update UI accordingly
        checkAuthStatus();
    }

    function checkAuthStatus() {
        // Get user data from localStorage
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const loginLink = document.getElementById('loginLink');
        const userProfileSection = document.getElementById('userProfileSection');
        const userEmailSpan = document.getElementById('userEmail');
        const dropdownEmail = document.getElementById('dropdownEmail');

        if (user && user.email) {
            // User is logged in
            if (loginLink) loginLink.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.remove('hidden');
            if (userEmailSpan) userEmailSpan.textContent = user.email;
            if (dropdownEmail) dropdownEmail.textContent = user.email;
        } else {
            // User is not logged in
            if (loginLink) loginLink.classList.remove('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
        }

        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        }
    }
})();
