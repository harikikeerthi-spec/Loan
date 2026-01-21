// API Base URL
const API_URL = 'http://localhost:3000';

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const getOtpSignupBtn = document.getElementById('getOtpSignupBtn');
    const submitBtn = document.getElementById('submitBtn');
    const otpSection = document.getElementById('otpSection');
    const signupEmailInput = document.getElementById('signupEmail');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const dateOfBirthInput = document.getElementById('dateOfBirth');
    const resendSignupBtn = document.getElementById('resendSignupBtn');

    if (getOtpSignupBtn) {
        getOtpSignupBtn.addEventListener('click', async () => {
            const email = signupEmailInput.value.trim();
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const phoneNumber = phoneNumberInput.value.trim();
            const dateOfBirth = dateOfBirthInput.value;

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

            if (!email) {
                showToast('Please enter your email', 'error');
                signupEmailInput.focus();
                return;
            }

            getOtpSignupBtn.disabled = true;
            getOtpSignupBtn.textContent = 'Checking...';

            try {
                console.log('Sending OTP request to:', `${API_URL}/auth/register/send-otp`);
                const response = await fetch(`${API_URL}/auth/register/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        firstName,
                        lastName,
                        phoneNumber,
                        dateOfBirth
                    }),
                });

                console.log('Response status:', response.status);
                const responseData = await response.json();
                console.log('Response data:', responseData);

                // Check if user already exists or validation failed
                if (responseData.success === false) {
                    showToast(responseData.message, 'error');
                    if (responseData.redirect === 'login') {
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                        return;
                    }
                    getOtpSignupBtn.disabled = false;
                    getOtpSignupBtn.textContent = 'Get OTP';
                    return;
                }

                if (!response.ok) throw new Error('Failed to send OTP: ' + (responseData.message || response.statusText));

                showToast('OTP sent to your email!', 'success');
                otpSection.classList.remove('hidden');
                getOtpSignupBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');

                // Focus first OTP input
                const otpInputs = document.querySelectorAll('.otp-input');
                if (otpInputs.length > 0) {
                    otpInputs[0].focus();
                }
            } catch (error) {
                console.error('Error details:', error);
                showToast('Error sending OTP: ' + error.message, 'error');
                getOtpSignupBtn.disabled = false;
                getOtpSignupBtn.textContent = 'Get OTP';
            }
        });

        if (resendSignupBtn) {
            resendSignupBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = signupEmailInput.value.trim();

                try {
                    const firstName = firstNameInput.value.trim();
                    const lastName = lastNameInput.value.trim();
                    const phoneNumber = phoneNumberInput.value.trim();
                    const dateOfBirth = dateOfBirthInput.value;

                    const response = await fetch(`${API_URL}/auth/register/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email,
                            firstName,
                            lastName,
                            phoneNumber,
                            dateOfBirth
                        }),
                    });

                    if (!response.ok) throw new Error('Failed to resend OTP');

                    showToast('OTP resent to your email!', 'success');

                    // Clear OTP inputs
                    const otpInputs = document.querySelectorAll('.otp-input');
                    otpInputs.forEach(input => input.value = '');
                    if (otpInputs.length > 0) {
                        otpInputs[0].focus();
                    }
                } catch (error) {
                    showToast('Error resending OTP', 'error');
                    console.error(error);
                }
            });
        }
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupEmailInput.value.trim();
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const otpInputs = document.querySelectorAll('.otp-input');
        let otp = '';
        otpInputs.forEach(input => otp += input.value);

        if (otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        try {
            console.log('Verifying OTP for signup...');
            // Verify OTP to complete registration
            const verifyResponse = await fetch(`${API_URL}/auth/register/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            if (!verifyResponse.ok) throw new Error('Invalid OTP');

            // If OTP is verified, create account (in this case, the user is already created on OTP verification)
            const data = await verifyResponse.json();

            // Store user data in localStorage BEFORE redirect
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('firstName', data.firstName || firstName);
            localStorage.setItem('lastName', data.lastName || lastName);

            console.log('Signup successful! Data saved:', {
                accessToken: localStorage.getItem('accessToken'),
                userEmail: localStorage.getItem('userEmail'),
                firstName: localStorage.getItem('firstName'),
                lastName: localStorage.getItem('lastName')
            });

            showToast('Account created successfully! Redirecting to dashboard...', 'success');

            // Use setTimeout to ensure localStorage is written before redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('Error details:', error);
            showToast('Invalid OTP or Signup Failed: ' + error.message, 'error');
        }
    });
}
