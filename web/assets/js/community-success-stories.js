// Community Success Stories API Integration
const API_BASE_URL = 'http://localhost:3000/community';

// State management
let allStories = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadSuccessStories();
    setupFilterButtons();
    setupSubmissionModal();
});

// Load success stories
async function loadSuccessStories(country = '', category = '') {
    try {
        showLoading();
        const queryParams = new URLSearchParams();

        if (country) queryParams.append('country', country);
        if (category) queryParams.append('category', category);
        queryParams.append('limit', 12);

        const response = await fetch(`${API_BASE_URL}/stories?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            allStories = data.data;
            displayStories(data.data);
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading success stories:', error);
        hideLoading();
        showError('Failed to load success stories.');
    }
}

// Load featured stories
async function loadFeaturedStories() {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/featured?limit=6`);
        const data = await response.json();

        if (data.success) {
            displayStories(data.data);
        }
    } catch (error) {
        console.error('Error loading featured stories:', error);
    }
}

// Display stories in the grid
function displayStories(stories) {
    const storiesGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-8');

    if (!storiesGrid) return;

    if (stories.length === 0) {
        storiesGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-600 dark:text-gray-400">No success stories found. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    storiesGrid.innerHTML = stories.map(story => {
        // Truncate story to first 200 characters
        const truncatedStory = story.story.length > 200
            ? story.story.substring(0, 200) + '...'
            : story.story;

        return `
            <div class="glass-card p-8 rounded-[2.5rem] story-card">
                <div class="flex items-center gap-4 mb-6">
                    <img src="${story.image || 'assets/img/avatar_1.png'}" 
                         class="w-16 h-16 rounded-full object-cover" 
                         alt="${story.name}">
                    <div>
                        <h4 class="font-bold text-lg text-gray-900 dark:text-white">${story.name}</h4>
                        <p class="text-xs text-gray-500">${story.degree} @ ${story.university}</p>
                    </div>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span class="material-symbols-outlined text-sm text-primary">location_on</span>
                        <span>${story.country}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span class="material-symbols-outlined text-sm text-primary">account_balance</span>
                        <span>${story.bank}</span>
                    </div>
                </div>

                <div class="mb-6">
                    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        "${truncatedStory}"
                    </p>
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                    <span class="text-xs font-bold text-primary">Loan: ${story.loanAmount}</span>
                    ${story.interestRate ? `<span class="text-xs font-bold text-gray-500">${story.interestRate} Interest</span>` : ''}
                </div>

                <button onclick="openStoryModal('${story.id}')" 
                        class="mt-4 w-full px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all">
                    Read Full Story
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
        { label: 'All', value: 'all' },
        { label: 'USA', value: 'USA', type: 'country' },
        { label: 'UK', value: 'UK', type: 'country' },
        { label: 'Canada', value: 'Canada', type: 'country' },
        { label: 'Australia', value: 'Australia', type: 'country' },
        { label: 'MBA', value: 'MBA', type: 'category' },
        { label: 'Engineering', value: 'Engineering', type: 'category' },
        { label: 'Medical', value: 'Medical', type: 'category' }
    ];

    filterContainer.innerHTML = filters.map(filter => `
        <button onclick="applyFilter('${filter.value}', '${filter.type || ''}')"
                data-filter="${filter.value}"
                class="filter-btn px-6 py-2 rounded-full ${filter.value === 'all' ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'} text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">
            ${filter.label}
        </button>
    `).join('');
}

// Apply filter
function applyFilter(value, type) {
    currentFilter = value;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === value) {
            btn.classList.add('bg-primary', 'text-white');
            btn.classList.remove('bg-white', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
        } else {
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-white', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
        }
    });

    // Load stories with filter
    if (value === 'all') {
        loadSuccessStories();
    } else if (type === 'country') {
        loadSuccessStories(value, '');
    } else if (type === 'category') {
        loadSuccessStories('', value);
    }
}

// Open story detail modal
async function openStoryModal(storyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/${storyId}`);
        const data = await response.json();

        if (data.success) {
            showStoryModal(data.data);
        }
    } catch (error) {
        console.error('Error loading story details:', error);
        showError('Failed to load story details.');
    }
}

// Show story modal
function showStoryModal(story) {
    const modalHTML = `
        <div id="storyDetailModal" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onclick="closeStoryModal()"></div>
                
                <div class="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-[2rem] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div class="p-8 max-h-[80vh] overflow-y-auto">
                        <div class="flex items-start justify-between mb-6">
                            <div class="flex items-center gap-4">
                                <img src="${story.image || 'assets/img/avatar_1.png'}" 
                                     class="w-20 h-20 rounded-full object-cover" 
                                     alt="${story.name}">
                                <div>
                                    <h3 class="text-2xl font-bold font-display text-gray-900 dark:text-white">${story.name}</h3>
                                    <p class="text-sm text-gray-500">${story.degree} @ ${story.university}</p>
                                    <p class="text-sm text-gray-500">${story.country}</p>
                                </div>
                            </div>
                            <button onclick="closeStoryModal()" class="text-gray-400 hover:text-gray-600">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div class="space-y-6">
                            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                <div>
                                    <p class="text-xs text-gray-500 mb-1">Loan Amount</p>
                                    <p class="font-bold text-primary">${story.loanAmount}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 mb-1">Bank</p>
                                    <p class="font-bold text-gray-900 dark:text-white">${story.bank}</p>
                                </div>
                                ${story.interestRate ? `
                                    <div>
                                        <p class="text-xs text-gray-500 mb-1">Interest Rate</p>
                                        <p class="font-bold text-gray-900 dark:text-white">${story.interestRate}</p>
                                    </div>
                                ` : ''}
                                <div>
                                    <p class="text-xs text-gray-500 mb-1">Category</p>
                                    <p class="font-bold text-gray-900 dark:text-white">${story.category || 'Education'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-bold text-lg text-gray-900 dark:text-white mb-3">My Story</h4>
                                <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    ${story.story}
                                </p>
                            </div>
                            
                            ${story.tips ? `
                                <div>
                                    <h4 class="font-bold text-lg text-gray-900 dark:text-white mb-3">💡 My Tips for You</h4>
                                    <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                        ${story.tips}
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="mt-8 text-center">
                            <button onclick="closeStoryModal()" 
                                    class="px-8 py-3 bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all">
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

// Close story modal
function closeStoryModal() {
    const modal = document.getElementById('storyDetailModal');
    if (modal) {
        modal.remove();
    }
}

// Setup submission modal
function setupSubmissionModal() {
    const modalHTML = `
        <div id="submissionModal" class="hidden fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onclick="closeSubmissionModal()"></div>
                
                <div class="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-[2rem] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div class="p-8 max-h-[80vh] overflow-y-auto">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold font-display text-gray-900 dark:text-white">Share Your Success Story</h3>
                            <button onclick="closeSubmissionModal()" class="text-gray-400 hover:text-gray-600">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form id="storySubmissionForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                                    <input type="text" id="storyName" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                    <input type="email" id="storyEmail" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">University</label>
                                    <input type="text" id="storyUniversity" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Country</label>
                                    <select id="storyCountry" required
                                            class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                        <option value="">Select Country</option>
                                        <option value="USA">USA</option>
                                        <option value="UK">UK</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                        <option value="Germany">Germany</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Degree/Program</label>
                                    <input type="text" id="storyDegree" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                           placeholder="e.g., MBA, MS CS, etc.">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                    <select id="storyCategory"
                                            class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                        <option value="">Select Category</option>
                                        <option value="MBA">MBA</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Medical">Medical</option>
                                        <option value="Law">Law</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Loan Amount</label>
                                    <input type="text" id="storyLoanAmount" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                           placeholder="e.g., ₹40,00,000">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bank</label>
                                    <input type="text" id="storyBank" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                           placeholder="e.g., HDFC, SBI, etc.">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Interest Rate (Optional)</label>
                                <input type="text" id="storyInterestRate"
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                       placeholder="e.g., 7.5%">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Story</label>
                                <textarea id="storyContent" required rows="6"
                                          class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                          placeholder="Share your journey of securing an education loan and achieving your dreams..."></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tips for Others (Optional)</label>
                                <textarea id="storyTips" rows="3"
                                          class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                          placeholder="Share advice for students going through the loan process..."></textarea>
                            </div>
                            
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <p class="text-sm text-blue-800 dark:text-blue-300">
                                    📝 Your story will be reviewed by our team before being published to ensure quality and authenticity.
                                </p>
                            </div>
                            
                            <button type="submit" 
                                    class="w-full px-6 py-4 bg-primary text-white rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all">
                                Submit Your Story
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup form submission
    document.getElementById('storySubmissionForm').addEventListener('submit', handleStorySubmission);
}

// Open submission modal
function openSubmissionModal() {
    document.getElementById('submissionModal').classList.remove('hidden');
}

// Close submission modal
function closeSubmissionModal() {
    document.getElementById('submissionModal').classList.add('hidden');
    document.getElementById('storySubmissionForm').reset();
}

// Handle story submission
async function handleStorySubmission(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('storyName').value,
        email: document.getElementById('storyEmail').value,
        university: document.getElementById('storyUniversity').value,
        country: document.getElementById('storyCountry').value,
        degree: document.getElementById('storyDegree').value,
        category: document.getElementById('storyCategory').value,
        loanAmount: document.getElementById('storyLoanAmount').value,
        bank: document.getElementById('storyBank').value,
        interestRate: document.getElementById('storyInterestRate').value,
        story: document.getElementById('storyContent').value,
        tips: document.getElementById('storyTips').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/stories/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Thank you for sharing your story! We will review and publish it soon.');
            closeSubmissionModal();
        } else {
            showError(data.message || 'Failed to submit story');
        }
    } catch (error) {
        console.error('Error submitting story:', error);
        showError('Failed to submit story. Please try again.');
    }
}

// Utility functions
function showLoading() {
    const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-8');
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Loading success stories...</p>
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
window.applyFilter = applyFilter;
window.openStoryModal = openStoryModal;
window.closeStoryModal = closeStoryModal;
window.openSubmissionModal = openSubmissionModal;
window.closeSubmissionModal = closeSubmissionModal;
