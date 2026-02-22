/**
 * Component Loader
 * Loads navbar and footer components into pages
 * Also includes page-level authentication guard
 */

(function () {
    'use strict';

    // ── Page Guard: Block unauthenticated access on protected pages ────
    const PUBLIC_PAGES = [
        'index.html', '', // root
        'about-us.html',
        'login.html',
        'signup.html',
        'onboarding.html',
        'blog.html',
        'blog-article.html',
        'faq.html',
        'contact.html',
        'privacy-policy.html',
        'terms-conditions.html',
        'cookies.html',
        'how-it-works.html',
        'help.html',
    ];

    const pagePath = window.location.pathname;
    const currentPage = (pagePath.substring(pagePath.lastIndexOf('/') + 1) || 'index.html').toLowerCase();
    const isPublic = PUBLIC_PAGES.includes(currentPage);
    const isLoggedIn = !!localStorage.getItem('accessToken');
    const needsGuard = !isPublic && !isLoggedIn;

    // Detect admin pages so we don't show the *user* login overlay on admin routes
    const isAdminPage = currentPage.startsWith('admin-') || currentPage === 'admin-dashboard.html' || pagePath.includes('/admin/');

    // Only lock scroll for non-admin protected pages (admin pages use their own admin-login flow)
    if (needsGuard && !isAdminPage) {
        // Lock scroll immediately
        document.documentElement.style.overflow = 'hidden';
    }

    function showLoginOverlay() {
        if (!needsGuard || document.getElementById('pageGuardOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'pageGuardOverlay';
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        overlay.innerHTML = `
            <style>
                #pageGuardOverlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(25,15,35,.65);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);animation:pgFadeIn .4s ease-out}
                @keyframes pgFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes pgSlideUp{from{opacity:0;transform:translateY(40px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
                .pg-card{position:relative;max-width:440px;width:90%;padding:3rem 2.5rem;border-radius:2.5rem;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.6);box-shadow:0 24px 80px rgba(102,5,199,.18),0 8px 32px rgba(0,0,0,.10);text-align:center;animation:pgSlideUp .5s cubic-bezier(.16,1,.3,1) .1s both;overflow:hidden}
                .dark .pg-card,.pg-card-dark{background:rgba(30,20,45,.92)!important;border-color:rgba(255,255,255,.08)!important}
                .dark .pg-title{color:#fff!important}
                .dark .pg-desc{color:#a0a0b0!important}
                .dark .pg-signup{color:#d0d0e0!important}
                .dark .pg-signup a{color:#a78bfa!important}
                .dark .pg-home-link{color:#888!important}
                .pg-glow{position:absolute;top:-60%;left:50%;transform:translateX(-50%);width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(102,5,199,.25) 0%,transparent 70%);pointer-events:none}
                .pg-icon-wrap{width:72px;height:72px;margin:0 auto 1.5rem;border-radius:50%;background:linear-gradient(135deg,#6605c7 0%,#a855f7 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(102,5,199,.35)}
                .pg-icon-wrap .material-symbols-outlined{font-size:32px;color:#fff}
                .pg-title{font-family:'Noto Serif',serif;font-size:1.75rem;font-weight:700;color:#1a1a2e;margin-bottom:.5rem;line-height:1.3}
                .pg-desc{font-family:'Noto Sans',sans-serif;font-size:.95rem;color:#6b7280;line-height:1.6;margin-bottom:2rem}
                .pg-btn-primary{display:block;width:100%;padding:1rem;border:none;border-radius:99px;background:linear-gradient(135deg,#6605c7 0%,#8b2cf5 100%);color:#fff;font-family:'Noto Sans',sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;text-decoration:none;text-align:center;transition:all .3s ease;box-shadow:0 8px 24px rgba(102,5,199,.3)}
                .pg-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(102,5,199,.45)}
                .pg-btn-primary:active{transform:translateY(0)}
                .pg-signup{font-family:'Noto Sans',sans-serif;font-size:.85rem;color:#6b7280;margin-top:1.25rem}
                .pg-signup a{color:#6605c7;font-weight:700;text-decoration:none}
                .pg-signup a:hover{text-decoration:underline}
                .pg-home-link{display:inline-flex;align-items:center;gap:.35rem;margin-top:1.25rem;font-family:'Noto Sans',sans-serif;font-size:.75rem;font-weight:700;color:#9ca3af;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;transition:color .2s}
                .pg-home-link:hover{color:#6605c7}
                .pg-home-link .material-symbols-outlined{font-size:16px}
            </style>
            <div class="pg-card">
                <div class="pg-glow"></div>
                <div class="pg-icon-wrap">
                    <span class="material-symbols-outlined">lock</span>
                </div>
                <h2 class="pg-title">Sign in to continue</h2>
                <p class="pg-desc">Log in to your account to access this page, join discussions, and connect with the community.</p>
                <a href="login.html?redirect=${redirectUrl}" class="pg-btn-primary">Sign In</a>
                <p class="pg-signup">Don't have an account? <a href="signup.html">Create one</a></p>
                <a href="index.html" class="pg-home-link">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Back to Home
                </a>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    // ── End Page Guard ──────────────────────────────────────────────────


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
        // Show login overlay if user is not authenticated on a protected page
        // Do NOT show the user login overlay on admin pages (admin-login.html handles admin access)
        const isAdminPageForOverlay = currentPage.startsWith('admin-') || currentPage === 'admin-dashboard.html' || pagePath.includes('/admin/');
        if (!isAdminPageForOverlay) {
            showLoginOverlay();
        }

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
