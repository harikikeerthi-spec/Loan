// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `glass-card px-6 py-4 rounded-2xl shadow-lg transform transition-all duration-300 translate-x-0 opacity-100 max-w-sm`;

    // Set color based on type
    let iconColor = 'text-blue-500';
    let icon = 'info';

    if (type === 'error') {
        iconColor = 'text-red-500';
        icon = 'error';
    } else if (type === 'success') {
        iconColor = 'text-green-500';
        icon = 'check_circle';
    } else if (type === 'warning') {
        iconColor = 'text-yellow-500';
        icon = 'warning';
    }

    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined ${iconColor}">${icon}</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto material-symbols-outlined text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">close</button>
        </div>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}
