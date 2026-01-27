// Initialize Theme
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
    }
});

// Dynamic Component Injection
async function loadComponent(id, url) {
    const container = document.getElementById(id);
    if (!container) return;
    try {
        const response = await fetch(url);
        const html = await response.text();
        container.innerHTML = html;

        // Post-load initialization (e.g., active link highlighting)
        if (id === 'header-root') {
            highlightActiveLink();
        }
    } catch (error) {
        console.error(`Failed to load component from ${url}:`, error);
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('#mainNav a');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('text-primary');
            link.classList.remove('text-gray-600', 'dark:text-gray-400', 'text-[#140d1c]/60');
        }
    });
}

// Note: Login flow moved to assets/js/login.js using unified endpoints.
