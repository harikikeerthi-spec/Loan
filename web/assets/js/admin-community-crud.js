// Admin Community CRUD Operations
// API_BASE_URL is defined in blog-api.js or admin-dashboard.js (globally available)

// ==================== MENTOR OPERATIONS ====================

// Open Mentor Modal (Create or Edit)
async function openMentorModal(mentorId = null) {
    const modal = document.getElementById('mentorModal');
    const form = document.getElementById('mentorForm');
    const title = document.getElementById('mentorModalTitle');
    const idInput = document.getElementById('mentorId');

    // Reset form
    form.reset();
    idInput.value = '';

    if (mentorId) {
        // Edit Mode
        title.textContent = 'Edit Mentor';
        idInput.value = mentorId;

        try {
            const response = await fetch(`${API_BASE_URL}/community/mentors/${mentorId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const data = await response.json();

            if (data.success) {
                const mentor = data.data;
                document.getElementById('mentorName').value = mentor.name || '';
                document.getElementById('mentorEmail').value = mentor.email || '';
                document.getElementById('mentorUniversity').value = mentor.university || '';
                document.getElementById('mentorDegree').value = mentor.degree || '';
                document.getElementById('mentorCountry').value = mentor.country || '';
                document.getElementById('mentorBank').value = mentor.loanBank || '';
                document.getElementById('mentorLoanAmount').value = mentor.loanAmount || '';
                document.getElementById('mentorExpertise').value = mentor.expertise ? mentor.expertise.join(', ') : '';
                document.getElementById('mentorBio').value = mentor.bio || '';
            }
        } catch (error) {
            console.error('Error fetching mentor details:', error);
            showError('Failed to load mentor details');
        }
    } else {
        // Create Mode
        title.textContent = 'Add New Mentor';
    }

    modal.classList.add('active');
}

// Close Mentor Modal
function closeMentorModal() {
    document.getElementById('mentorModal').classList.remove('active');
}

// Alias for compatibility
function openCreateMentorModal() { openMentorModal(); }
function openEditMentorModal(id) { openMentorModal(id); }

// Handle Mentor Form Submit
async function handleMentorSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('mentorId').value;
    const isEdit = !!id;

    const mentorData = {
        name: document.getElementById('mentorName').value,
        email: document.getElementById('mentorEmail').value,
        university: document.getElementById('mentorUniversity').value,
        degree: document.getElementById('mentorDegree').value,
        country: document.getElementById('mentorCountry').value,
        loanBank: document.getElementById('mentorBank').value,
        loanAmount: document.getElementById('mentorLoanAmount').value,
        expertise: document.getElementById('mentorExpertise').value.split(',').map(s => s.trim()).filter(s => s),
        bio: document.getElementById('mentorBio').value
    };

    try {
        const url = isEdit
            ? `${API_BASE_URL}/community/admin/mentors/${id}`
            : `${API_BASE_URL}/community/admin/mentors`;

        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mentorData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess(`Mentor ${isEdit ? 'updated' : 'created'} successfully!`);
            closeMentorModal();
            if (window.loadMentors) window.loadMentors();
        } else {
            showError(result.message || `Failed to ${isEdit ? 'update' : 'create'} mentor`);
        }
    } catch (error) {
        console.error('Error saving mentor:', error);
        showError('An error occurred');
    }
}

// Delete Mentor
async function deleteMentor(id) {
    if (!confirm('Are you sure you want to delete this mentor?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/mentors/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (response.ok) {
            showSuccess('Mentor deleted successfully');
            if (window.loadMentors) window.loadMentors();
        } else {
            showError('Failed to delete mentor');
        }
    } catch (error) {
        console.error('Error deleting mentor:', error);
        showError('An error occurred');
    }
}


// ==================== EVENT OPERATIONS ====================

// Open Event Modal
async function openEventModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const title = document.getElementById('eventModalTitle');
    const idInput = document.getElementById('eventId');

    form.reset();
    idInput.value = '';

    if (eventId) {
        title.textContent = 'Edit Event';
        idInput.value = eventId;

        try {
            const response = await fetch(`${API_BASE_URL}/community/events/${eventId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const data = await response.json();

            if (data.success) {
                const event = data.data;
                document.getElementById('eventTitle').value = event.title || '';
                document.getElementById('eventType').value = event.type || 'webinar';
                if (event.date) {
                    const dateObj = new Date(event.date);
                    document.getElementById('eventDate').value = dateObj.toISOString().split('T')[0];
                }
                document.getElementById('eventTime').value = event.time || '';
                document.getElementById('eventDuration').value = event.duration || '';
                document.getElementById('eventSpeaker').value = event.speaker || '';
                document.getElementById('eventDescription').value = event.description || '';
                document.getElementById('eventIsFree').checked = event.isFree !== false;
                document.getElementById('eventIsFeatured').checked = !!event.isFeatured;
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    } else {
        title.textContent = 'Add New Event';
    }

    modal.classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

function openCreateEventModal() { openEventModal(); }
function openEditEventModal(id) { openEventModal(id); }

// Handle Event Submit
async function handleEventSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('eventId').value;
    const isEdit = !!id;

    const eventData = {
        title: document.getElementById('eventTitle').value,
        type: document.getElementById('eventType').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        duration: parseInt(document.getElementById('eventDuration').value),
        speaker: document.getElementById('eventSpeaker').value,
        description: document.getElementById('eventDescription').value,
        isFree: document.getElementById('eventIsFree').checked,
        isFeatured: document.getElementById('eventIsFeatured').checked
    };

    try {
        const url = isEdit
            ? `${API_BASE_URL}/community/admin/events/${id}`
            : `${API_BASE_URL}/community/admin/events`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            showSuccess(`Event ${isEdit ? 'updated' : 'created'} successfully!`);
            closeEventModal();
            if (window.loadEvents) window.loadEvents();
        } else {
            const res = await response.json();
            showError(res.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showError('An error occurred');
    }
}

async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (response.ok) {
            showSuccess('Event deleted');
            if (window.loadEvents) window.loadEvents();
        }
    } catch (e) {
        console.error(e);
        showError('Failed to delete event');
    }
}


// ==================== RESOURCE OPERATIONS ====================

async function openResourceModal(resourceId = null) {
    const modal = document.getElementById('resourceModal');
    const form = document.getElementById('resourceForm');
    const title = document.getElementById('resourceModalTitle');
    const idInput = document.getElementById('resourceId');

    form.reset();
    idInput.value = '';

    if (resourceId) {
        title.textContent = 'Edit Resource';
        idInput.value = resourceId;
        try {
            const response = await fetch(`${API_BASE_URL}/community/resources/${resourceId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const data = await response.json();
            if (data.success) {
                const res = data.data;
                document.getElementById('resourceTitle').value = res.title || '';
                document.getElementById('resourceType').value = res.type || 'guide';
                document.getElementById('resourceCategory').value = res.category || '';
                document.getElementById('resourceUrl').value = res.downloadUrl || res.fileUrl || '';
                document.getElementById('resourceDescription').value = res.description || '';
                document.getElementById('resourceIsFeatured').checked = !!res.isFeatured;
            }
        } catch (e) { console.error(e); }
    } else {
        title.textContent = 'Add New Resource';
    }
    modal.classList.add('active');
}

function closeResourceModal() {
    document.getElementById('resourceModal').classList.remove('active');
}

function openCreateResourceModal() { openResourceModal(); }
function openEditResourceModal(id) { openResourceModal(id); }

async function handleResourceSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('resourceId').value;
    const isEdit = !!id;

    const resourceData = {
        title: document.getElementById('resourceTitle').value,
        type: document.getElementById('resourceType').value,
        category: document.getElementById('resourceCategory').value,
        downloadUrl: document.getElementById('resourceUrl').value,
        description: document.getElementById('resourceDescription').value,
        isFeatured: document.getElementById('resourceIsFeatured').checked
    };

    try {
        const url = isEdit
            ? `${API_BASE_URL}/community/admin/resources/${id}`
            : `${API_BASE_URL}/community/admin/resources`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resourceData)
        });

        if (response.ok) {
            showSuccess(`Resource ${isEdit ? 'updated' : 'created'} successfully!`);
            closeResourceModal();
            if (window.loadResources) window.loadResources();
        } else {
            showError('Operation failed');
        }
    } catch (e) {
        console.error(e);
        showError('Error saving resource');
    }
}

async function deleteResource(id) {
    if (!confirm('Delete this resource?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/resources/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (response.ok) {
            showSuccess('Resource deleted');
            if (window.loadResources) window.loadResources();
        }
    } catch (e) {
        console.error(e);
        showError('Delete failed');
    }
}


// ==================== STORY OPERATIONS ====================

async function openStoryModal(storyId = null) {
    const modal = document.getElementById('storyModal');
    const form = document.getElementById('storyForm');
    const title = document.getElementById('storyModalTitle');
    const idInput = document.getElementById('storyId');

    form.reset();
    idInput.value = '';

    if (storyId) {
        title.textContent = 'Edit Success Story';
        idInput.value = storyId;
        try {
            const response = await fetch(`${API_BASE_URL}/community/stories/${storyId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const data = await response.json();
            if (data.success) {
                const s = data.data;
                document.getElementById('storyName').value = s.name || '';
                document.getElementById('storyEmail').value = s.email || '';
                document.getElementById('storyUniversity').value = s.university || '';
                document.getElementById('storyDegree').value = s.degree || '';
                document.getElementById('storyCountry').value = s.country || '';
                document.getElementById('storyBank').value = s.bank || '';
                document.getElementById('storyLoanAmount').value = s.loanAmount || '';
                document.getElementById('storyContent').value = s.story || '';
                document.getElementById('storyTips').value = s.tips || '';
            }
        } catch (e) { console.error(e); }
    } else {
        title.textContent = 'Add Success Story';
    }
    modal.classList.add('active');
}

function closeStoryModal() {
    document.getElementById('storyModal').classList.remove('active');
}

function openCreateStoryModal() { openStoryModal(); }
function openEditStoryModal(id) { openStoryModal(id); }

async function handleStorySubmit(event) {
    event.preventDefault();
    const id = document.getElementById('storyId').value;
    const isEdit = !!id;

    const storyData = {
        name: document.getElementById('storyName').value,
        email: document.getElementById('storyEmail').value,
        university: document.getElementById('storyUniversity').value,
        degree: document.getElementById('storyDegree').value,
        country: document.getElementById('storyCountry').value,
        bank: document.getElementById('storyBank').value,
        loanAmount: document.getElementById('storyLoanAmount').value,
        story: document.getElementById('storyContent').value,
        tips: document.getElementById('storyTips').value,
        isApproved: true
    };

    try {
        const url = isEdit
            ? `${API_BASE_URL}/community/admin/stories/${id}`
            : `${API_BASE_URL}/community/admin/stories`;

        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storyData)
        });

        if (response.ok) {
            showSuccess(`Story ${isEdit ? 'updated' : 'created'} successfully!`);
            closeStoryModal();
            if (window.loadSuccessStories) window.loadSuccessStories();
        } else {
            const res = await response.json();
            showError(res.message || 'Operation failed');
        }

    } catch (e) {
        console.error(e);
        showError('Error saving story');
    }
}

async function deleteStory(id) {
    if (!confirm('Delete this story?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/stories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });

        if (response.ok) {
            showSuccess('Story deleted');
            if (window.loadSuccessStories) window.loadSuccessStories();
        } else {
            showError('Failed to delete story');
        }
    } catch (e) {
        console.error(e);
        showError('Delete failed');
    }
}

// Global expose
window.openMentorModal = openMentorModal;
window.closeMentorModal = closeMentorModal;
window.openCreateMentorModal = openCreateMentorModal;
window.openEditMentorModal = openEditMentorModal;
window.handleMentorSubmit = handleMentorSubmit;
window.deleteMentor = deleteMentor;

window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.openCreateEventModal = openCreateEventModal;
window.openEditEventModal = openEditEventModal;
window.handleEventSubmit = handleEventSubmit;
window.deleteEvent = deleteEvent;

window.openResourceModal = openResourceModal;
window.closeResourceModal = closeResourceModal;
window.openCreateResourceModal = openCreateResourceModal;
window.openEditResourceModal = openEditResourceModal;
window.handleResourceSubmit = handleResourceSubmit;
window.deleteResource = deleteResource;

window.openStoryModal = openStoryModal;
window.closeStoryModal = closeStoryModal;
window.openCreateStoryModal = openCreateStoryModal;
window.openEditStoryModal = openEditStoryModal;
window.handleStorySubmit = handleStorySubmit;
window.deleteStory = deleteStory;
