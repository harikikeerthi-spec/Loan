// Community Events API Integration
const API_BASE_URL = 'http://localhost:3000/community';

// State management
let upcomingEvents = [];
let pastEvents = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUpcomingEvents();
    loadPastEvents();
    setupRegistrationModal();
});

// Load upcoming events
async function loadUpcomingEvents() {
    try {
        showLoadingUpcoming();
        const response = await fetch(`${API_BASE_URL}/events/upcoming?limit=10`);
        const data = await response.json();

        if (data.success) {
            upcomingEvents = data.data;
            displayUpcomingEvents(data.data);
        }
        hideLoadingUpcoming();
    } catch (error) {
        console.error('Error loading upcoming events:', error);
        hideLoadingUpcoming();
        showError('Failed to load upcoming events.');
    }
}

// Load past events
async function loadPastEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/past?limit=6`);
        const data = await response.json();

        if (data.success) {
            pastEvents = data.data;
            displayPastEvents(data.data);
        }
    } catch (error) {
        console.error('Error loading past events:', error);
    }
}

// Display upcoming events
function displayUpcomingEvents(events) {
    const eventsContainer = document.querySelector('.space-y-6');

    if (!eventsContainer) return;

    if (events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="glass-card p-8 rounded-[2.5rem] text-center">
                <p class="text-gray-600 dark:text-gray-400">No upcoming events at the moment. Check back soon!</p>
            </div>
        `;
        return;
    }

    eventsContainer.innerHTML = events.map((event, index) => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate().toString().padStart(2, '0');
        const month = eventDate.toLocaleString('en-US', { month: 'short' });
        const isFeatured = index === 0 || event.isFeatured;

        const gradientColors = [
            'from-primary to-purple-600',
            'from-blue-500 to-indigo-600',
            'from-orange-500 to-red-600',
            'from-green-500 to-emerald-600'
        ];
        const gradient = gradientColors[index % gradientColors.length];

        const badgeColors = {
            'webinar': 'bg-red-500/10 text-red-600 dark:text-red-400',
            'qa': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            'networking': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
            'workshop': 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        };

        return `
            <div class="glass-card p-8 rounded-[2.5rem] event-card transition-all duration-300 ${isFeatured ? 'border-l-4 border-primary' : ''}">
                <div class="flex flex-col md:flex-row gap-6 items-start">
                    <div class="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white">
                        <span class="text-3xl font-bold">${day}</span>
                        <span class="text-xs uppercase tracking-wider">${month}</span>
                    </div>
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-3 py-1 rounded-full ${badgeColors[event.type] || badgeColors.webinar} text-[10px] font-bold uppercase tracking-wider">
                                ${event.type}
                            </span>
                            ${event.isFree ? '<span class="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">Free</span>' : ''}
                        </div>
                        
                        <h3 class="text-2xl font-bold font-display text-gray-900 dark:text-white mb-2">
                            ${event.title}
                        </h3>
                        
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            ${event.description}
                        </p>
                        
                        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-lg">schedule</span>
                                <span>${event.time}</span>
                            </div>
                            ${event.attendeesCount ? `
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-lg">groups</span>
                                    <span>${event.attendeesCount} Registered</span>
                                </div>
                            ` : ''}
                            ${event.speaker ? `
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-lg">person</span>
                                    <span>${event.speaker}${event.speakerTitle ? ' (' + event.speakerTitle + ')' : ''}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="mt-6">
                            <button onclick="openRegistrationModal('${event.id}')" 
                                    class="px-8 py-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/30">
                                Register Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display past events (recordings)
function displayPastEvents(events) {
    const recordingsGrid = document.querySelector('.mt-20 .grid');

    if (!recordingsGrid) return;

    if (events.length === 0) {
        recordingsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-600 dark:text-gray-400">No past event recordings available yet.</p>
            </div>
        `;
        return;
    }

    const gradientColors = [
        'from-primary/20 to-purple-500/20',
        'from-blue-500/20 to-indigo-500/20',
        'from-green-500/20 to-emerald-500/20',
        'from-orange-500/20 to-red-500/20',
        'from-pink-500/20 to-rose-500/20',
        'from-teal-500/20 to-cyan-500/20'
    ];

    const iconColors = [
        'text-primary',
        'text-blue-600',
        'text-green-600',
        'text-orange-600',
        'text-pink-600',
        'text-teal-600'
    ];

    recordingsGrid.innerHTML = events.map((event, index) => {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const gradient = gradientColors[index % gradientColors.length];
        const iconColor = iconColors[index % iconColors.length];

        return `
            <div class="glass-card p-6 rounded-3xl group hover:-translate-y-2 transition-all duration-300">
                <div class="aspect-video bg-gradient-to-br ${gradient} rounded-2xl mb-4 flex items-center justify-center cursor-pointer"
                     onclick="playRecording('${event.recordingUrl || ''}', '${event.title}')">
                    <span class="material-symbols-outlined text-6xl ${iconColor}">play_circle</span>
                </div>
                <h4 class="font-bold text-lg text-gray-900 dark:text-white mb-2">${event.title}</h4>
                <p class="text-xs text-gray-500 mb-4">${formattedDate} • ${event.attendeesCount || 0} views</p>
                <button onclick="playRecording('${event.recordingUrl || ''}', '${event.title}')"
                        class="text-xs font-bold text-primary uppercase tracking-wider hover:underline">
                    Watch Recording →
                </button>
            </div>
        `;
    }).join('');
}

// Setup registration modal
function setupRegistrationModal() {
    const modalHTML = `
        <div id="registrationModal" class="hidden fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onclick="closeRegistrationModal()"></div>
                
                <div class="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-[2rem] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="p-8">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold font-display text-gray-900 dark:text-white">Register for Event</h3>
                            <button onclick="closeRegistrationModal()" class="text-gray-400 hover:text-gray-600">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form id="registrationForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input type="text" id="regName" required
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <input type="email" id="regEmail" required
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number (Optional)</label>
                                <input type="tel" id="regPhone"
                                       class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                       placeholder="+91 9876543210">
                            </div>
                            
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <p class="text-sm text-blue-800 dark:text-blue-300">
                                    📧 You'll receive a confirmation email with the event link and calendar invite.
                                </p>
                            </div>
                            
                            <button type="submit" 
                                    class="w-full px-6 py-4 bg-primary text-white rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all">
                                Complete Registration
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup form submission
    document.getElementById('registrationForm').addEventListener('submit', handleRegistrationSubmit);
}

// Open registration modal
let selectedEventId = null;
function openRegistrationModal(eventId) {
    selectedEventId = eventId;
    document.getElementById('registrationModal').classList.remove('hidden');
}

// Close registration modal
function closeRegistrationModal() {
    document.getElementById('registrationModal').classList.add('hidden');
    document.getElementById('registrationForm').reset();
    selectedEventId = null;
}

// Handle registration form submission
async function handleRegistrationSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/events/${selectedEventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Registration successful! Check your email for event details and calendar invite.');
            closeRegistrationModal();
            // Reload events to show updated attendee count
            loadUpcomingEvents();
        } else {
            showError(data.message || 'Failed to register for event');
        }
    } catch (error) {
        console.error('Error registering for event:', error);
        showError('Failed to register. Please try again.');
    }
}

// Play recording
function playRecording(recordingUrl, title) {
    if (!recordingUrl) {
        showError('Recording not available yet.');
        return;
    }

    // Open recording in new tab or show in modal
    window.open(recordingUrl, '_blank');
}

// Subscribe to calendar
function subscribeToCalendar() {
    showSuccess('Calendar subscription feature coming soon! You can manually add events to your calendar from the registration confirmation email.');
}

// Add event listener to subscribe button
document.addEventListener('DOMContentLoaded', () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const subscribeButton = buttons.find(btn => btn.textContent.includes('Subscribe to Calendar'));
    if (subscribeButton) {
        subscribeButton.addEventListener('click', subscribeToCalendar);
    }
});

// Utility functions
function showLoadingUpcoming() {
    const container = document.querySelector('.space-y-6');
    if (container) {
        container.innerHTML = `
            <div class="glass-card p-8 rounded-[2.5rem] text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
            </div>
        `;
    }
}

function hideLoadingUpcoming() {
    // Loading will be replaced by actual content
}

function showSuccess(message) {
    alert(message); // Replace with your toast notification system
}

function showError(message) {
    alert(message); // Replace with your toast notification system
}

// Make functions globally available
window.openRegistrationModal = openRegistrationModal;
window.closeRegistrationModal = closeRegistrationModal;
window.playRecording = playRecording;
window.subscribeToCalendar = subscribeToCalendar;
