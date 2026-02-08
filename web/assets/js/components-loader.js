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

        // Call auth navbar update if available
        if (typeof updateNavbarAuth === 'function') {
            updateNavbarAuth();
        }
    }

    function initializeComponentScripts() {
        // Initialize navigation scroll effect
        const nav = document.getElementById('mainNav');
        if (nav) {
            // Check if page has a hero section (like index.html)
            // If not, add a class to make navbar readable on light backgrounds
            const hasHero = !!document.getElementById('heroVideo') || !!document.querySelector('.pt-48');
            if (!hasHero) {
                nav.classList.add('nav-on-light');
            }

            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    nav.classList.add('nav-scrolled');
                } else {
                    nav.classList.remove('nav-scrolled');
                }
            });
        }
    }
})();
