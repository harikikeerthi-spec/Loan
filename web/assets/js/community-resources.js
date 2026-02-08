// Community Resources API Integration
const API_BASE_URL = 'http://localhost:3000/community';

// State management
let allResources = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadAllResources();
    loadPopularResources();
    setupFilterButtons();
});

// Load all resources
async function loadAllResources(type = '', category = '') {
    try {
        showLoading();
        const queryParams = new URLSearchParams();

        if (type) queryParams.append('type', type);
        if (category) queryParams.append('category', category);
        queryParams.append('limit', 12);

        const response = await fetch(`${API_BASE_URL}/resources?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            allResources = data.data;
            displayResources(data.data);
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading resources:', error);
        hideLoading();
        showError('Failed to load resources.');
    }
}

// Load popular resources
async function loadPopularResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/resources/popular?limit=5`);
        const data = await response.json();

        if (data.success) {
            displayPopularResources(data.data);
        }
    } catch (error) {
        console.error('Error loading popular resources:', error);
    }
}

// Display resources in the grid
function displayResources(resources) {
    // Matches the "All Resources" grid in HTML: grid-cols-1 md:grid-cols-3 gap-6
    const resourcesGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-6');

    if (!resourcesGrid) return;

    if (resources.length === 0) {
        resourcesGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-600 dark:text-gray-400">No resources found. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    const typeIcons = {
        'guide': 'menu_book',
        'template': 'description',
        'checklist': 'checklist',
        'video': 'play_circle'
    };

    const typeColors = {
        'guide': 'from-blue-500 to-indigo-600',
        'template': 'from-green-500 to-emerald-600',
        'checklist': 'from-orange-500 to-red-600',
        'video': 'from-purple-500 to-pink-600'
    };

    const badgeColors = {
        'guide': 'bg-blue-500/10 text-blue-600',
        'template': 'bg-green-500/10 text-green-600',
        'checklist': 'bg-orange-500/10 text-orange-600',
        'video': 'bg-purple-500/10 text-purple-600'
    };

    resourcesGrid.innerHTML = resources.map(resource => {
        const icon = typeIcons[resource.type] || 'description';
        const gradient = typeColors[resource.type] || typeColors.guide;
        const badgeColor = badgeColors[resource.type] || badgeColors.guide;

        return `
            <div class="glass-card p-8 rounded-[2.5rem] hover:-translate-y-2 transition-all duration-300">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl text-white">${icon}</span>
                    </div>
                    ${resource.isFeatured ? '<span class="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-[10px] font-bold">FEATURED</span>' : ''}
                </div>

                <h3 class="text-xl font-bold font-display text-gray-900 dark:text-white mb-3">
                    ${resource.title}
                </h3>

                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    ${resource.description}
                </p>

                <div class="flex items-center justify-between mb-4">
                    <span class="px-3 py-1 rounded-full ${badgeColor} text-[10px] font-bold uppercase">
                        ${resource.type}
                    </span>
                    <span class="text-xs text-gray-500">
                        ${resource.downloads.toLocaleString()} downloads
                    </span>
                </div>

                <button onclick="downloadResource('${resource.id}', '${resource.title}')" 
                        class="w-full px-6 py-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-lg">download</span>
                    <span>Download</span>
                </button>
            </div>
        `;
    }).join('');
}

// Display popular resources
function displayPopularResources(resources) {
    // Matches the "Featured Resources" grid in HTML: grid-cols-1 md:grid-cols-2 gap-8
    const popularGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-8');

    if (!popularGrid || resources.length === 0) return;

    const typeIcons = {
        'guide': 'menu_book',
        'template': 'description',
        'checklist': 'checklist',
        'video': 'play_circle'
    };

    const typeColors = {
        'guide': 'from-blue-500 to-indigo-600',
        'template': 'from-green-500 to-emerald-600',
        'checklist': 'from-orange-500 to-red-600',
        'video': 'from-purple-500 to-pink-600'
    };

    popularGrid.innerHTML = resources.map(resource => {
        const icon = typeIcons[resource.type] || 'description';
        const gradient = typeColors[resource.type] || typeColors.guide;

        return `
            <div class="glass-card p-8 rounded-[2.5rem] resource-card transition-all duration-300">
                <div class="flex items-start justify-between mb-6">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl text-white">${icon}</span>
                    </div>
                    <span class="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">Popular</span>
                </div>
                <h3 class="text-xl font-bold font-display text-gray-900 dark:text-white mb-3">${resource.title}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed line-clamp-3">
                    ${resource.description}
                </p>
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">download</span>
                            <span>${resource.downloads.toLocaleString()} downloads</span>
                        </div>
                    </div>
                    <span class="text-xs font-bold text-gray-500 uppercase">${resource.type}</span>
                </div>
                <button onclick="downloadResource('${resource.id}', '${resource.title}')"
                    class="w-full px-6 py-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-sm">download</span> Download
                </button>
            </div>
         `;
    }).join('');
}

// Setup filter buttons
function setupFilterButtons() {
    const filterContainer = document.querySelector('.flex.flex-wrap.justify-center.gap-3.mb-12');
    if (!filterContainer) return;

    const filters = [
        { label: 'All Resources', value: '' },
        { label: 'Guides', value: 'guide', type: 'type' },
        { label: 'Checklists', value: 'checklist', type: 'type' },
        { label: 'Templates', value: 'template', type: 'type' },
        { label: 'Videos', value: 'video', type: 'type' }
    ];

    filterContainer.innerHTML = filters.map(filter => `
        <button onclick="handleFilterClick(this, '${filter.value}', '${filter.type || ''}')"
                class="filter-btn px-6 py-2 rounded-full ${filter.value === '' ? 'bg-primary text-white' : 'bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-300'} text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">
            ${filter.label}
        </button>
    `).join('');

    // Setup submit button
    const submitBtns = Array.from(document.querySelectorAll('button'));
    const submitBtn = submitBtns.find(b => b.textContent.includes('Submit Resource'));
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            alert('Resource submission feature coming soon!'); // Or implement modal
        });
    }
}

// Handle filter click
window.handleFilterClick = function (btn, value, type) {
    // Update UI
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-white');
        b.classList.add('bg-white/50', 'dark:bg-white/10', 'text-gray-600', 'dark:text-gray-300');
    });
    btn.classList.remove('bg-white/50', 'dark:bg-white/10', 'text-gray-600', 'dark:text-gray-300');
    btn.classList.add('bg-primary', 'text-white');

    // Load data
    if (type === 'type') {
        loadAllResources(value, '');
    } else {
        loadAllResources('', value); // Assuming category if not type, or reset
    }
};

// Download resource
async function downloadResource(resourceId, title) {
    try {
        // Track the download
        await fetch(`${API_BASE_URL}/resources/${resourceId}/track`, {
            method: 'POST'
        });

        // Get resource details
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);
        const data = await response.json();

        if (data.success && data.data.downloadUrl) {
            // Open download URL
            window.open(data.data.downloadUrl, '_blank');
            showSuccess(`Downloading "${title}"...`);
        } else if (data.success && data.data.fileUrl) {
            // Open file URL
            window.open(data.data.fileUrl, '_blank');
            showSuccess(`Opening "${title}"...`);
        } else {
            showError('Download link not available for this resource.');
        }
    } catch (error) {
        console.error('Error downloading resource:', error);
        showError('Failed to download resource.');
    }
}

// View resource details
async function viewResourceDetails(resourceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);
        const data = await response.json();

        if (data.success) {
            showResourceModal(data.data);
        }
    } catch (error) {
        console.error('Error loading resource details:', error);
        showError('Failed to load resource details.');
    }
}

// Show resource detail modal
function showResourceModal(resource) {
    const typeIcons = {
        'guide': 'menu_book',
        'template': 'description',
        'checklist': 'checklist',
        'video': 'play_circle'
    };

    const modalHTML = `
        <div id="resourceDetailModal" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onclick="closeResourceModal()"></div>
                
                <div class="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-[2rem] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div class="p-8">
                        <div class="flex items-start justify-between mb-6">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-3xl text-white">${typeIcons[resource.type] || 'description'}</span>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-bold font-display text-gray-900 dark:text-white">${resource.title}</h3>
                                    <p class="text-sm text-gray-500">${resource.type.toUpperCase()} • ${resource.downloads.toLocaleString()} downloads</p>
                                </div>
                            </div>
                            <button onclick="closeResourceModal()" class="text-gray-400 hover:text-gray-600">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div class="space-y-4 mb-6">
                            <div>
                                <h4 class="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    ${resource.description}
                                </p>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                <div>
                                    <p class="text-xs text-gray-500 mb-1">Type</p>
                                    <p class="font-bold text-gray-900 dark:text-white">${resource.type}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 mb-1">Category</p>
                                    <p class="font-bold text-gray-900 dark:text-white">${resource.category}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex gap-4">
                            <button onclick="downloadResource('${resource.id}', '${resource.title}')" 
                                    class="flex-1 px-6 py-3 bg-primary text-white rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined">download</span>
                                <span>Download</span>
                            </button>
                            <button onclick="closeResourceModal()" 
                                    class="px-6 py-3 bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close resource modal
function closeResourceModal() {
    const modal = document.getElementById('resourceDetailModal');
    if (modal) {
        modal.remove();
    }
}

// Filter by type
function filterByType(type) {
    loadAllResources(type, '');
}

// Filter by category
function filterByCategory(category) {
    loadAllResources('', category);
}

// Utility functions
function showLoading() {
    const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-6');
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Loading resources...</p>
            </div>
        `;
    }
}

function hideLoading() {
    // Loading will be replaced by actual content
}

function showSuccess(message) {
    alert(message); // Replace with your toast notification system
}

function showError(message) {
    alert(message); // Replace with your toast notification system
}

// Make functions globally available
window.downloadResource = downloadResource;
window.viewResourceDetails = viewResourceDetails;
window.closeResourceModal = closeResourceModal;
window.filterByType = filterByType;
window.filterByCategory = filterByCategory;
