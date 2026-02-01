// Profile page functionality
const API_URL = 'http://localhost:3000';

// Get user email from localStorage
const currentUserEmail = localStorage.getItem('userEmail');

if (!currentUserEmail) {
    window.location.href = 'login.html';
}

// DOM elements
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const actionButtons = document.getElementById('actionButtons');
const profileForm = document.getElementById('profileForm');

// Input fields
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const phoneNumberInput = document.getElementById('phoneNumber');
const dateOfBirthInput = document.getElementById('dateOfBirth');

// Store original values for cancel functionality
let originalValues = {};

// Load user profile data
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentUserEmail }),
        });

        const data = await response.json();

        if (data.success && data.user) {
            const user = data.user;

            // Populate fields
            firstNameInput.value = user.firstName || '';
            lastNameInput.value = user.lastName || '';
            emailInput.value = user.email || '';
            phoneNumberInput.value = user.phoneNumber || '';
            dateOfBirthInput.value = user.dateOfBirth || '';

            // Store original values
            originalValues = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                dateOfBirth: user.dateOfBirth || '',
            };
        } else {
            showToast('Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile data', 'error');
    }
}

// Enable editing mode
function enableEditMode() {
    firstNameInput.disabled = false;
    lastNameInput.disabled = false;
    phoneNumberInput.disabled = false;
    dateOfBirthInput.disabled = false;

    editBtn.classList.add('hidden');
    actionButtons.classList.remove('hidden');

    showToast('Edit mode enabled', 'info');
}

// Disable editing mode
function disableEditMode() {
    firstNameInput.disabled = true;
    lastNameInput.disabled = true;
    phoneNumberInput.disabled = true;
    dateOfBirthInput.disabled = true;

    editBtn.classList.remove('hidden');
    actionButtons.classList.add('hidden');
}

// Cancel editing
function cancelEdit() {
    firstNameInput.value = originalValues.firstName;
    lastNameInput.value = originalValues.lastName;
    phoneNumberInput.value = originalValues.phoneNumber;
    dateOfBirthInput.value = originalValues.dateOfBirth;

    disableEditMode();
    showToast('Changes cancelled', 'info');
}

// Save profile updates
async function saveProfile(e) {
    e.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phoneNumber = phoneNumberInput.value.trim();
    const dateOfBirth = dateOfBirthInput.value.trim();

    // Basic validation
    if (!firstName || !lastName) {
        showToast('First and Last names are required', 'error');
        return;
    }

    if (!phoneNumber) {
        showToast('Phone number is required', 'error');
        return;
    }

    if (!dateOfBirth) {
        showToast('Date of birth is required', 'error');
        return;
    }

    // Validate date format (DD-MM-YYYY)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    if (!dateRegex.test(dateOfBirth)) {
        showToast('Please enter date in DD-MM-YYYY format', 'error');
        return;
    }

    try {
        showToast('Saving changes...', 'info');

        const response = await fetch(`${API_URL}/auth/update-details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: currentUserEmail,
                firstName,
                lastName,
                phoneNumber,
                dateOfBirth,
            }),
        });

        const data = await response.json();

        if (data.success) {
            showToast('Profile updated successfully!', 'success');

            // Update original values
            originalValues = {
                firstName,
                lastName,
                phoneNumber,
                dateOfBirth,
            };

            disableEditMode();
        } else {
            showToast(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}

// Event listeners
editBtn.addEventListener('click', enableEditMode);
cancelBtn.addEventListener('click', cancelEdit);
profileForm.addEventListener('submit', saveProfile);

// Load profile on page load
loadProfile();
