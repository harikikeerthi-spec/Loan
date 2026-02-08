// Community Mentorship API Integration
const API_BASE_URL = 'http://localhost:3000/community';

// State management
let allMentors = [];
let currentFilters = {
    university: '',
    country: '',
    category: '',
    limit: 6,
    offset: 0
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadMentorStats();
    loadFeaturedMentors();
    setupFilterListeners();
    setupBookingModal();
    setupApplicationModal();
});

// Load mentor statistics
async function loadMentorStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/mentors/stats`);
        const data = await response.json();

        if (data.success) {
            updateStatsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading mentor stats:', error);
    }
}

// Update statistics in the UI
function updateStatsDisplay(stats) {
    const statsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4.gap-6.mb-16');

    if (statsContainer) {
        const statCards = statsContainer.querySelectorAll('.glass-card');

        if (statCards[0]) {
            statCards[0].querySelector('.text-4xl').textContent = `${stats.activeMentors}+`;
        }
        if (statCards[1]) {
            statCards[1].querySelector('.text-4xl').textContent = `${stats.totalStudentsMentored.toLocaleString()}+`;
        }
        if (statCards[3]) {
            statCards[3].querySelector('.text-4xl').textContent = `${stats.averageRating.toFixed(1)}/5`;
        }
    }
}

// Load featured mentors
async function loadFeaturedMentors() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/mentors/featured?limit=6`);
        const data = await response.json();

        if (data.success) {
            allMentors = data.data;
            displayMentors(data.data);
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading mentors:', error);
        hideLoading();
        showError('Failed to load mentors. Please try again later.');
    }
}

// Load mentors with filters
async function loadMentors(filters = currentFilters) {
    try {
        showLoading();
        const queryParams = new URLSearchParams();

        if (filters.university) queryParams.append('university', filters.university);
        if (filters.country) queryParams.append('country', filters.country);
        if (filters.category) queryParams.append('category', filters.category);
        queryParams.append('limit', filters.limit);
        queryParams.append('offset', filters.offset);

        const response = await fetch(`${API_BASE_URL}/mentors?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            allMentors = data.data;
            displayMentors(data.data);
            updatePagination(data.pagination);
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading mentors:', error);
        hideLoading();
        showError('Failed to load mentors. Please try again later.');
    }
}

// Display mentors in the grid
function displayMentors(mentors) {
    const mentorsGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-8');

    if (!mentorsGrid) return;

    if (mentors.length === 0) {
        mentorsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-600 dark:text-gray-400">No mentors found. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    mentorsGrid.innerHTML = mentors.map(mentor => `
        <div class="glass-card p-8 rounded-[2.5rem] mentor-card transition-all duration-300 hover:-translate-y-2">
            <div class="flex items-start gap-4 mb-6">
                <div class="overflow-hidden rounded-2xl">
                    <img src="${mentor.image || 'assets/img/avatar_1.png'}" 
                         class="w-20 h-20 object-cover mentor-image" 
                         alt="${mentor.name}">
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-lg text-gray-900 dark:text-white mb-1">${mentor.name}</h4>
                    <p class="text-xs text-gray-500 mb-2">${mentor.degree} @ ${mentor.university}</p>
                    <div class="flex items-center gap-1 text-xs text-yellow-600">
                        <span class="material-symbols-outlined text-sm">star</span>
                        <span class="font-bold">${mentor.rating.toFixed(1)}</span>
                        <span class="text-gray-400">(${mentor.studentsMentored} mentored)</span>
                    </div>
                </div>
            </div>

            <div class="space-y-3 mb-6">
                <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span class="material-symbols-outlined text-sm text-primary">account_balance</span>
                    <span>${mentor.loanBank} - ${mentor.loanAmount}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span class="material-symbols-outlined text-sm text-primary">location_on</span>
                    <span>${mentor.country} - ${mentor.category || 'Education'}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span class="material-symbols-outlined text-sm text-primary">schedule</span>
                    <span>${mentor.studentsMentored} students mentored</span>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-6">
                ${mentor.expertise.slice(0, 3).map(exp => `
                    <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">${exp}</span>
                `).join('')}
            </div>

            <button onclick="openBookingModal('${mentor.id}')" 
                    class="w-full px-6 py-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">
                Book Session
            </button>
        </div>
    `).join('');
}

// Setup filter listeners
function setupFilterListeners() {
    // Add filter dropdowns or buttons here
    // This is a placeholder - you can add actual filter UI elements
    const browseAllButton = document.querySelector('button:contains("Browse All")');
    if (browseAllButton) {
        browseAllButton.addEventListener('click', () => {
            currentFilters.limit = 250;
            loadMentors();
        });
    }
}

// Setup booking modal
function setupBookingModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="bookingModal" class="hidden fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onclick="closeBookingModal()"></div>
                
                <div class="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-[2rem] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="p-8">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold font-display text-gray-900 dark:text-white">Book Mentorship Session</h3>
                            <button onclick="closeBookingModal()" class="text-gray-400 hover:text-gray-600">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form id="bookingForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                                <input type="text" id="studentName" required
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input type="email" id="studentEmail" required
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone (Optional)</label>
                                <input type="tel" id="studentPhone"
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Preferred Date</label>
                                    <input type="date" id="preferredDate" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Preferred Time</label>
                                    <input type="time" id="preferredTime" required
                                           class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message (Optional)</label>
                                <textarea id="message" rows="3"
                                          class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                          placeholder="What would you like to discuss?"></textarea>
                            </div>
                            
                            <button type="submit" 
                                    class="w-full px-6 py-4 bg-primary text-white rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all">
                                Submit Booking Request
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
}

// Open booking modal
let selectedMentorId = null;
function openBookingModal(mentorId) {
    selectedMentorId = mentorId;
    document.getElementById('bookingModal').classList.remove('hidden');
    // Set minimum date to today
    const dateInput = document.getElementById('preferredDate');
    dateInput.min = new Date().toISOString().split('T')[0];
}

// Close booking modal
function closeBookingModal() {
    document.getElementById('bookingModal').classList.add('hidden');
    document.getElementById('bookingForm').reset();
    selectedMentorId = null;
}

// Handle booking form submission
async function handleBookingSubmit(e) {
    e.preventDefault();

    const formData = {
        studentName: document.getElementById('studentName').value,
        studentEmail: document.getElementById('studentEmail').value,
        studentPhone: document.getElementById('studentPhone').value,
        preferredDate: document.getElementById('preferredDate').value,
        preferredTime: document.getElementById('preferredTime').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/mentors/${selectedMentorId}/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Booking request submitted successfully! The mentor will contact you soon.');
            closeBookingModal();
        } else {
            showError(data.message || 'Failed to submit booking request');
        }
    } catch (error) {
        console.error('Error submitting booking:', error);
        showError('Failed to submit booking request. Please try again.');
    }
}

// Setup application modal
function setupApplicationModal() {
    const applyButtons = Array.from(document.querySelectorAll('button'));
    const applyButton = applyButtons.find(btn => btn.textContent.trim().includes('Apply to Mentor'));

    if (applyButton) {
        applyButton.addEventListener('click', openApplicationModal);
    }
}

// Utility functions
function showLoading() {
    const mentorsGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-8');
    if (mentorsGrid) {
        mentorsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Loading mentors...</p>
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

function updatePagination(pagination) {
    // Basic pagination implementation can be added here
    // For now, we just log it as the UI might need specific container
    // If a 'Load More' button exists, we could toggle its visibility
    const loadMoreBtn = document.getElementById('loadMoreMentorsBtn');
    if (loadMoreBtn) {
        if (pagination.hasMore) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.onclick = () => {
                const currentOffset = pagination.offset + pagination.limit;
                // You would need to pass current filters here. For now, we just load more.
                // ideally loadMentors should take an offset or we store state
                loadMentorsWithOffset(currentOffset);
            };
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

// Helper to load more (assumes we want to append)
function loadMentorsWithOffset(offset) {
    // This requires refactoring loadAllMentors to accept offset and append
    // For this MVP, we will stick to basic load
    console.log('Load more offset:', offset);
}

// Make functions globally available
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
