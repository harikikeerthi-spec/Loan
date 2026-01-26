// API Base URL
const API_URL = 'http://localhost:3000';

// Check if user is logged in
const accessToken = localStorage.getItem('accessToken');
const userEmail = localStorage.getItem('userEmail');

if (!accessToken || !userEmail) {
    // User not logged in, redirect to signup
    window.location.href = 'signup.html';
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

        // Basic validation
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
            console.log('Updating user details...');
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

            // Update localStorage with user details
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('lastName', lastName);
            localStorage.setItem('userPhoneNumber', phoneNumber);
            localStorage.setItem('userDateOfBirth', dateOfBirth);

            console.log('Profile updated successfully!');
            showToast('Profile completed successfully! Redirecting to dashboard...', 'success');

            // Redirect to homepage with dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('Error details:', error);
            showToast('Error updating profile: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Profile';
        }
    });
}
