// Authentication Modal Handler
const API_URL = 'http://localhost:3000/api';

let authModal = document.getElementById('authModal');
let registerLink = document.getElementById('registerLink');
let closeAuthModal = document.getElementById('closeAuthModal');
let emailStep = document.getElementById('emailStep');
let otpStep = document.getElementById('otpStep');

// Email Step Elements
const authEmail = document.getElementById('authEmail');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const emailError = document.getElementById('emailError');

// OTP Step Elements
const otpInput = document.getElementById('otpInput');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const otpError = document.getElementById('otpError');
const otpEmail = document.getElementById('otpEmail');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const backToEmailBtn = document.getElementById('backToEmailBtn');

let currentEmail = '';

// Open Auth Modal
function bindOpenHandler() {
    // Re-query in case elements were dynamically rendered
    authModal = document.getElementById('authModal');
    registerLink = document.getElementById('registerLink');
    if (registerLink && !registerLink.dataset.listenerAdded) {
        registerLink.dataset.listenerAdded = 'true';
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (!authModal) authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.style.display = 'flex';
                if (authEmail) authEmail.focus();
            }
        });
    }
}
bindOpenHandler();

// Close Auth Modal
if (closeAuthModal && !closeAuthModal.dataset.listenerAdded) {
    closeAuthModal.dataset.listenerAdded = 'true';
    closeAuthModal.addEventListener('click', closeModal);
}

// Close modal when clicking outside
if (authModal && !authModal.dataset.backdropListenerAdded) {
    authModal.dataset.backdropListenerAdded = 'true';
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModal();
        }
    });
}

function closeModal() {
    if (!authModal) return;
    authModal.classList.add('hidden');
    authModal.style.display = 'none';
    resetForm();
}

function resetForm() {
    authEmail.value = '';
    otpInput.value = '';
    emailError.classList.add('hidden');
    otpError.classList.add('hidden');
    emailStep.classList.remove('hidden');
    otpStep.classList.add('hidden');
    currentEmail = '';
}

// Send OTP
if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        emailError.classList.add('hidden');

        if (!email) {
            showEmailError('Please enter your email address');
            return;
        }

        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';

        try {
            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showEmailError(data.message || 'Failed to send OTP');
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = 'Send OTP';
                return;
            }

            // OTP sent successfully
            currentEmail = email;
            otpEmail.textContent = email;
            emailStep.classList.add('hidden');
            otpStep.classList.remove('hidden');
            otpInput.focus();
            console.log('OTP sent successfully for:', email);
        } catch (error) {
            console.error('Error sending OTP:', error);
            showEmailError('Error sending OTP. Please try again.');
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
        }
    });
}

// Verify OTP
if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();
        otpError.classList.add('hidden');

        if (!otp || otp.length !== 6) {
            showOtpError('Please enter a valid 6-digit code');
            return;
        }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';

        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: currentEmail, 
                    otp 
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showOtpError(data.message || 'Invalid OTP');
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = 'Verify & Continue';
                return;
            }

            // OTP verified successfully
            console.log('OTP verified. Response:', data);

            // Save user data to localStorage
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('userEmail', currentEmail);
            if (data.userId) localStorage.setItem('userId', data.userId);
            if (data.firstName) localStorage.setItem('firstName', data.firstName);
            if (data.lastName) localStorage.setItem('lastName', data.lastName);

            // Update navbar to show profile and hide login button
            if (typeof updateNavbarAuth === 'function') {
                updateNavbarAuth();
            }

            // Close modal
            closeModal();

            // Determine where to navigate
            if (!data.userExists || !data.hasUserDetails) {
                // New user or user without details - go to user-details.html
                console.log('Navigating to user-details.html');
                setTimeout(() => {
                    window.location.href = 'user-details.html';
                }, 500);
            } else {
                // Existing user with complete profile - reload to show dashboard
                console.log('User logged in successfully');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            showOtpError('Error verifying OTP. Please try again.');
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify & Continue';
        }
    });
}

// Resend OTP
if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Sending...';

        try {
            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail }),
            });

            const data = await response.json();

            if (data.success) {
                showToast('OTP resent successfully', 'success');
                otpInput.value = '';
                otpInput.focus();
            } else {
                showOtpError(data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            showOtpError('Error resending OTP. Please try again.');
        } finally {
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = 'Resend Code';
        }
    });
}

// Back to Email
if (backToEmailBtn) {
    backToEmailBtn.addEventListener('click', () => {
        emailStep.classList.remove('hidden');
        otpStep.classList.add('hidden');
        authEmail.value = currentEmail;
        authEmail.focus();
        otpError.classList.add('hidden');
    });
}

// Enter key handlers
authEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendOtpBtn.click();
    }
});

otpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyOtpBtn.click();
    }
});

// OTP input only accepts digits
otpInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

function showEmailError(message) {
    emailError.textContent = message;
    emailError.classList.remove('hidden');
}

function showOtpError(message) {
    otpError.textContent = message;
    otpError.classList.remove('hidden');
}

function showToast(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can use the existing toast.js if available
    if (typeof toast === 'function') {
        toast(message, type);
    }
}
