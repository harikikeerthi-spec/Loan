// User profile details completion page for new/existing users without profile data
// Uses unified OTP authentication flow
const API_URL = 'http://localhost:3000/api';

// Verify user has been authenticated via OTP
const accessToken = localStorage.getItem('accessToken');
const userEmail = localStorage.getItem('userEmail');

if (!accessToken || !userEmail) {
    // User not authenticated, redirect to unified login flow
    window.location.href = 'login.html';
}

const userDetailsForm = document.getElementById('userDetailsForm');
if (userDetailsForm) {
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const dateOfBirthInput = document.getElementById('dateOfBirth');
    const submitBtn = document.getElementById('submitBtn');

    userDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const phoneNumber = phoneNumberInput.value.trim();
        const dateOfBirth = dateOfBirthInput.value;

        // Validate all required fields are filled
        if (!firstName) {
            showToast('Please enter your first name', 'error');
            firstNameInput.focus();
            return;
        }

        if (!lastName) {
            showToast('Please enter your last name', 'error');
            lastNameInput.focus();
            return;
        }

        if (!phoneNumber) {
            showToast('Please enter your phone number', 'error');
            phoneNumberInput.focus();
            return;
        }

        if (!dateOfBirth) {
            showToast('Please enter your date of birth', 'error');
            dateOfBirthInput.focus();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';

        try {
            // Submit profile details to complete registration/profile update
            const response = await fetch(`${API_URL}/auth/update-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    firstName,
                    lastName,
                    phoneNumber,
                    dateOfBirth
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile');
            }

            showToast('Profile completed successfully! Redirecting to home...', 'success');

            // Redirect to homepage after profile completion
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('Profile update error:', error);
            showToast('Error updating profile: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Profile';
        }
    });
}
