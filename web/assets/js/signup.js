// API Base URL
const API_URL = 'http://localhost:3000/api';

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const getOtpSignupBtn = document.getElementById('getOtpSignupBtn');
    const submitBtn = document.getElementById('submitBtn');
    const otpSection = document.getElementById('otpSection');
    const signupEmailInput = document.getElementById('signupEmail');
    const resendSignupBtn = document.getElementById('resendSignupBtn');

    // Rate limiting state
    let loginAttempts = 0;
    const MAX_ATTEMPTS = 5;
    const RATE_LIMIT_WINDOW = 60000; // 60 seconds
    let rateLimitExpires = 0;

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // OTP validation: 6 digits
    const validateOTP = (otp) => {
        const otpRegex = /^\d{6}$/;
        return otpRegex.test(otp);
    };

    // Check if rate limited
    const checkRateLimit = () => {
        const now = Date.now();
        if (rateLimitExpires && now < rateLimitExpires) {
            const secondsLeft = Math.ceil((rateLimitExpires - now) / 1000);
            return { limited: true, secondsLeft };
        }
        return { limited: false };
    };

    // Record login attempt
    const recordAttempt = () => {
        loginAttempts++;
        if (loginAttempts >= MAX_ATTEMPTS) {
            rateLimitExpires = Date.now() + RATE_LIMIT_WINDOW;
        }
    };

    // Reset rate limit
    const resetRateLimit = () => {
        loginAttempts = 0;
        rateLimitExpires = 0;
    };

    if (getOtpSignupBtn) {
        getOtpSignupBtn.addEventListener('click', async () => {
            const email = signupEmailInput.value.trim();

            // Validate input
            if (!email) {
                showToast('Please enter your email', 'error');
                signupEmailInput.focus();
                return;
            }

            if (!validateEmail(email)) {
                showToast('Please enter a valid email address.', 'error');
                signupEmailInput.focus();
                return;
            }

            // Check rate limit
            const rateLimitCheck = checkRateLimit();
            if (rateLimitCheck.limited) {
                showToast(`Too many attempts. Try again in ${rateLimitCheck.secondsLeft}s.`, 'error');
                getOtpSignupBtn.disabled = true;
                return;
            }

            getOtpSignupBtn.disabled = true;
            getOtpSignupBtn.textContent = 'Checking...';

            try {
                recordAttempt();

                // Request OTP (unified endpoint)
                const response = await fetch(`${API_URL}/auth/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Client-Version': '1.0'
                    },
                    body: JSON.stringify({
                        email
                    }),
                    credentials: 'include' // Include cookies
                });

                const responseData = await response.json();

                if (responseData.success === false) {
                    showToast(responseData.message || 'Failed to send OTP', 'error');
                    getOtpSignupBtn.disabled = false;
                    getOtpSignupBtn.textContent = 'Get OTP';
                    return;
                }

                showToast('OTP sent to your email! Valid for 10 minutes.', 'success');
                otpSection.classList.remove('hidden');
                getOtpSignupBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');

                // Focus on first OTP input
                const otpInputs = document.querySelectorAll('.otp-input');
                if (otpInputs.length > 0) {
                    otpInputs[0].focus();
                }
            } catch (error) {
                console.error('Error requesting OTP:', error);
                showToast('Network error. Please check your connection and try again.', 'error');
                getOtpSignupBtn.disabled = false;
                getOtpSignupBtn.textContent = 'Get OTP';
            }
        });

        if (resendSignupBtn) {
            resendSignupBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = signupEmailInput.value.trim();

                if (!validateEmail(email)) {
                    showToast('Please enter a valid email address.', 'error');
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/send-otp`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Client-Version': '1.0'
                        },
                        body: JSON.stringify({
                            email
                        }),
                        credentials: 'include'
                    });

                    const data = await response.json();
                    if (!data.success) throw new Error(data.message);

                    showToast('OTP resent to your email!', 'success');

                    // Clear OTP inputs
                    const otpInputs = document.querySelectorAll('.otp-input');
                    otpInputs.forEach(input => input.value = '');
                    if (otpInputs.length > 0) {
                        otpInputs[0].focus();
                    }
                } catch (error) {
                    showToast('Error resending OTP: ' + error.message, 'error');
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

        // Validate OTP format
        if (!validateOTP(otp)) {
            showToast('OTP must be exactly 6 digits.', 'error');
            return;
        }

        // Check rate limit
        const rateLimitCheck = checkRateLimit();
        if (rateLimitCheck.limited) {
            showToast(`Too many attempts. Try again in ${rateLimitCheck.secondsLeft}s.`, 'error');
            submitBtn.disabled = true;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        try {
            recordAttempt();

            // Verify OTP using login endpoint
            const verifyResponse = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '1.0'
                },
                body: JSON.stringify({ email, otp }),
                credentials: 'include'  // Include cookies for session token
            });

            const data = await verifyResponse.json();

            if (!data.success) {
                showToast(data.message || 'Invalid OTP or verification failed', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify';
                return;
            }

            // Store user data in session/state (not credentials)
            localStorage.setItem('accessToken', data.access_token);
            if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', data.userId || '');

            // Reset rate limit on success
            resetRateLimit();

            // Redirect based on user status
            if (!data.userExists) {
                showToast('Account verified! Please complete your profile.', 'success');
                setTimeout(() => {
                    window.location.href = 'user-details.html';
                }, 1500);
            } else {
                showToast('Welcome back! Redirecting home...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error during verification:', error);
            showToast('An error occurred. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    });
}
