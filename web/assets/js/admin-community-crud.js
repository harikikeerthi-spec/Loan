// Admin Community CRUD Operations
// API_BASE_URL is defined in admin-dashboard.js

// ==================== MENTOR CRUD ====================

/**
 * Create new mentor
 */
async function createMentor(mentorData) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/mentors`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mentorData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Mentor created successfully!');
            loadMentors(); // Reload the list
            closeCreateMentorModal();
            return result;
        } else {
            showError(result.message || 'Failed to create mentor');
            return null;
        }
    } catch (error) {
        console.error('Error creating mentor:', error);
        showError('Error creating mentor');
        return null;
    }
}

/**
 * Update mentor
 */
async function updateMentor(mentorId, mentorData) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/mentors/${mentorId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mentorData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Mentor updated successfully!');
            loadMentors(); // Reload the list
            closeEditMentorModal();
            return result;
        } else {
            showError(result.message || 'Failed to update mentor');
            return null;
        }
    } catch (error) {
        console.error('Error updating mentor:', error);
        showError('Error updating mentor');
        return null;
    }
}

/**
 * Delete mentor
 */
async function deleteMentor(mentorId) {
    if (!confirm('Are you sure you want to delete this mentor? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/mentors/${mentorId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Mentor deleted successfully!');
            loadMentors(); // Reload the list
            return result;
        } else {
            showError(result.message || 'Failed to delete mentor');
            return null;
        }
    } catch (error) {
        console.error('Error deleting mentor:', error);
        showError('Error deleting mentor');
        return null;
    }
}

// ==================== EVENT CRUD ====================

/**
 * Create new event
 */
async function createEvent(eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Event created successfully!');
            loadEvents(); // Reload the list
            closeCreateEventModal();
            return result;
        } else {
            showError(result.message || 'Failed to create event');
            return null;
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showError('Error creating event');
        return null;
    }
}

/**
 * Update event
 */
async function updateEvent(eventId, eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Event updated successfully!');
            loadEvents(); // Reload the list
            closeEditEventModal();
            return result;
        } else {
            showError(result.message || 'Failed to update event');
            return null;
        }
    } catch (error) {
        console.error('Error updating event:', error);
        showError('Error updating event');
        return null;
    }
}

/**
 * Delete event
 */
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Event deleted successfully!');
            loadEvents(); // Reload the list
            return result;
        } else {
            showError(result.message || 'Failed to delete event');
            return null;
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showError('Error deleting event');
        return null;
    }
}

// ==================== RESOURCE CRUD ====================

/**
 * Create new resource
 */
async function createResource(resourceData) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/resources`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resourceData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Resource created successfully!');
            loadResources(); // Reload the list
            closeCreateResourceModal();
            return result;
        } else {
            showError(result.message || 'Failed to create resource');
            return null;
        }
    } catch (error) {
        console.error('Error creating resource:', error);
        showError('Error creating resource');
        return null;
    }
}

/**
 * Update resource
 */
async function updateResource(resourceId, resourceData) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/resources/${resourceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resourceData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Resource updated successfully!');
            loadResources(); // Reload the list
            closeEditResourceModal();
            return result;
        } else {
            showError(result.message || 'Failed to update resource');
            return null;
        }
    } catch (error) {
        console.error('Error updating resource:', error);
        showError('Error updating resource');
        return null;
    }
}

/**
 * Delete resource
 */
async function deleteResource(resourceId) {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/resources/${resourceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Resource deleted successfully!');
            loadResources(); // Reload the list
            return result;
        } else {
            showError(result.message || 'Failed to delete resource');
            return null;
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
        showError('Error deleting resource');
        return null;
    }
}

// ==================== MODAL FUNCTIONS ====================

// These are placeholder functions - the actual modals should be created in the HTML
function closeCreateMentorModal() {
    const modal = document.getElementById('createMentorModal');
    if (modal) modal.classList.remove('active');
}

function closeEditMentorModal() {
    const modal = document.getElementById('editMentorModal');
    if (modal) modal.classList.remove('active');
}

function closeCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    if (modal) modal.classList.remove('active');
}

function closeEditEventModal() {
    const modal = document.getElementById('editEventModal');
    if (modal) modal.classList.remove('active');
}

function closeCreateResourceModal() {
    const modal = document.getElementById('createResourceModal');
    if (modal) modal.classList.remove('active');
}

function closeEditResourceModal() {
    const modal = document.getElementById('editResourceModal');
    if (modal) modal.classList.remove('active');
}

// Make functions globally available
window.createMentor = createMentor;
window.updateMentor = updateMentor;
window.deleteMentor = deleteMentor;
window.createEvent = createEvent;
window.updateEvent = updateEvent;
window.deleteEvent = deleteEvent;
window.createResource = createResource;
window.updateResource = updateResource;
window.deleteResource = deleteResource;
