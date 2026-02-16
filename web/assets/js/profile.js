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
const passportNumberInput = document.getElementById('passportNumber');

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

            // Handle DOB
            if (user.dateOfBirth) {
                try {
                    const dob = new Date(user.dateOfBirth);
                    if (!isNaN(dob.getTime())) {
                        const d = String(dob.getDate()).padStart(2, '0');
                        const m = String(dob.getMonth() + 1).padStart(2, '0');
                        const y = dob.getFullYear();
                        dateOfBirthInput.value = `${d}-${m}-${y}`;
                    } else {
                        dateOfBirthInput.value = user.dateOfBirth;
                    }
                } catch (e) {
                    dateOfBirthInput.value = user.dateOfBirth;
                }
            } else {
                dateOfBirthInput.value = '';
            }

            if (passportNumberInput) {
                passportNumberInput.value = user.passportNumber || '';
            }

            // Store original values
            originalValues = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                dateOfBirth: user.dateOfBirth || '',
                passportNumber: user.passportNumber || ''
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
    // Phone, DOB, and Passport remain disabled (readonly)
    // phoneNumberInput.disabled = false;
    // dateOfBirthInput.disabled = false;
    // if(passportNumberInput) passportNumberInput.disabled = false;

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
    if (passportNumberInput) passportNumberInput.disabled = true;

    editBtn.classList.remove('hidden');
    actionButtons.classList.add('hidden');
}

// Cancel editing
function cancelEdit() {
    firstNameInput.value = originalValues.firstName;
    lastNameInput.value = originalValues.lastName;
    // phoneNumberInput.value = originalValues.phoneNumber;
    // dateOfBirthInput.value = originalValues.dateOfBirth;

    disableEditMode();
    showToast('Changes cancelled', 'info');
}

// Save profile updates
async function saveProfile(e) {
    e.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    // We send existing values for others to ensure they are preserved if backend requires them, 
    // or just send what changed. Backend /update-details usually updates provided fields.
    // If they are disabled, user can't change them, but we still grab the value from input.
    const phoneNumber = phoneNumberInput.value.trim();
    const dateOfBirth = dateOfBirthInput.value.trim();
    const passportNumber = passportNumberInput ? passportNumberInput.value.trim() : '';

    // Basic validation
    if (!firstName || !lastName) {
        showToast('First and Last names are required', 'error');
        return;
    }

    // Since we are not editing phone/DOB, we assume they are valid from previous state. 
    // But if they were empty, we might want to prompt? 
    // Usually Profile is created with these details.

    try {
        showToast('Saving changes...', 'info');

        const updateData = {
            email: currentUserEmail,
            firstName,
            lastName,
            phoneNumber, // sending existing value
            dateOfBirth, // sending existing value
            // Add passport number if available
            passportNumber
        };

        const response = await fetch(`${API_URL}/auth/update-details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
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
                passportNumber
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
