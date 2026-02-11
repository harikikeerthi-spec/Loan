/**
 * Blog Builder - Utility Functions
 * Helper functions for the Canva-like blog builder
 */

/**
 * Generate unique ID for elements
 */
function generateElementId() {
    return 'element-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Clone object deeply
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Format slug from title
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format date
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Snap value to grid (optional)
 */
function snapToGrid(value, gridSize = 10) {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Constrain value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Get contrasting text color (black or white) based on background
 */
function getContrastingTextColor(hexColor) {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Show toast message
 */
function showToast(message, type = 'info', duration = 3000) {
    let toast = document.getElementById('builder-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'builder-toast';
        toast.className = 'fixed bottom-6 right-6 z-50 hidden';
        document.body.appendChild(toast);
    }

    const bgColor = type === 'success' ? 'bg-green-500' :
                   type === 'error' ? 'bg-red-500' :
                   type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

    toast.innerHTML = `
        <div class="glass-card rounded-xl p-4 shadow-xl max-w-sm">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-white">${
                    type === 'success' ? 'check_circle' :
                    type === 'error' ? 'error' :
                    type === 'warning' ? 'warning' : 'info'
                }</span>
                <p class="text-sm font-medium text-white">${escapeHTML(message)}</p>
            </div>
        </div>
    `;

    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Get element position relative to canvas
 */
function getElementPositionRelativeToCanvas(element, canvas) {
    const elementRect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    return {
        top: elementRect.top - canvasRect.top,
        left: elementRect.left - canvasRect.left,
        width: elementRect.width,
        height: elementRect.height
    };
}

/**
 * Export object
 */
window.BuilderUtils = {
    generateElementId,
    deepClone,
    generateSlug,
    escapeHTML,
    formatDate,
    snapToGrid,
    clamp,
    getContrastingTextColor,
    hexToRgb,
    showToast,
    debounce,
    throttle,
    getElementPositionRelativeToCanvas
};
