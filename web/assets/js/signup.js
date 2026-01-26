// API Base URL
const API_URL = 'http://localhost:3000';

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const getOtpSignupBtn = document.getElementById('getOtpSignupBtn');
    const submitBtn = document.getElementById('submitBtn');
    const otpSection = document.getElementById('otpSection');
    const signupEmailInput = document.getElementById('signupEmail');
    const resendSignupBtn = document.getElementById('resendSignupBtn');
    let authMode = 'register'; // 'register' for new users, 'login' for existing users

    const setAuthMode = (mode) => {
        authMode = mode;
        signupForm.dataset.authMode = mode;
    };

    const getAuthMode = () => signupForm.dataset.authMode || authMode;

    if (getOtpSignupBtn) {
        getOtpSignupBtn.addEventListener('click', async () => {
            const email = signupEmailInput.value.trim();

            if (!email) {
                showToast('Please enter your email', 'error');
                signupEmailInput.focus();
                return;
            }

            getOtpSignupBtn.disabled = true;
            getOtpSignupBtn.textContent = 'Checking...';

            try {
                // Determine whether this email already exists
                let isExistingUser = false;
                try {
                    const checkResponse = await fetch(`${API_URL}/auth/check-user/${encodeURIComponent(email)}`);
                    const checkData = await checkResponse.json();
                    isExistingUser = !!checkData.exists;
                } catch (checkError) {
                    console.error('User lookup failed:', checkError);
                    showToast('Could not check your account. Please try again.', 'error');
                    getOtpSignupBtn.disabled = false;
                    getOtpSignupBtn.textContent = 'Get OTP';
                    return;
                }

                const mode = isExistingUser ? 'login' : 'register';
                setAuthMode(mode);

                console.log('Sending OTP request to:', `${API_URL}/auth/${mode}/send-otp`);
                const response = await fetch(`${API_URL}/auth/${mode}/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                console.log('Response status:', response.status);
                const responseData = await response.json();
                console.log('Response data:', responseData);

                // Check for validation failure
                if (responseData.success === false) {
                    showToast(responseData.message, 'error');
                    if (responseData.redirect === 'login' || responseData.redirect === 'signup') {
                        setTimeout(() => {
                            window.location.href = `${responseData.redirect}.html`;
                        }, 1500);
                        return;
                    }
                    getOtpSignupBtn.disabled = false;
                    getOtpSignupBtn.textContent = 'Get OTP';
                    return;
                }

                if (!response.ok) throw new Error('Failed to send OTP: ' + (responseData.message || response.statusText));

                showToast(isExistingUser ? 'OTP sent! Enter it to sign in.' : 'OTP sent! Verify to continue.', 'success');
                otpSection.classList.remove('hidden');
                getOtpSignupBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');

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
                    const mode = getAuthMode();
                    const response = await fetch(`${API_URL}/auth/${mode}/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                    });

                    if (!response.ok) throw new Error('Failed to resend OTP');

                    showToast('OTP resent to your email!', 'success');

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
        const otpInputs = document.querySelectorAll('.otp-input');
        let otp = '';
        otpInputs.forEach(input => otp += input.value);

        if (otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        try {
            const mode = getAuthMode();
            console.log('Verifying OTP for auth mode:', mode);

            const verifyResponse = await fetch(`${API_URL}/auth/${mode}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            if (!verifyResponse.ok) throw new Error('Invalid OTP');

            const data = await verifyResponse.json();

            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('firstName', data.firstName || '');
            localStorage.setItem('lastName', data.lastName || '');

            console.log('Auth successful! Data saved:', {
                accessToken: localStorage.getItem('accessToken'),
                userEmail: localStorage.getItem('userEmail'),
                firstName: localStorage.getItem('firstName'),
                lastName: localStorage.getItem('lastName'),
                hasUserDetails: data.hasUserDetails
            });

            if (!data.hasUserDetails) {
                showToast('Verified! Please finish your details.', 'success');
                setTimeout(() => {
                    window.location.href = 'user-details.html';
                }, 1500);
            } else {
                showToast('Welcome back! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error details:', error);
            showToast('Invalid OTP or verification failed: ' + error.message, 'error');
        }
    });
}
