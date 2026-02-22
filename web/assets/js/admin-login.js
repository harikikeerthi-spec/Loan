// Admin Login page flow
const API_URL = (() => {
    if (window.APP_CONFIG && window.APP_CONFIG.apiBase) {
        return window.APP_CONFIG.apiBase;
    }
    if (window.location.protocol === 'file:') {
        return 'http://localhost:3000';
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    return window.location.origin;
})();

(function initAdminLogin() {
    const emailInput = document.getElementById('email');
    const getOtpBtn = document.getElementById('getOtpBtn');
    const loginForm = document.getElementById('loginForm');
    const otpSection = document.getElementById('otpSection');
    const submitBtn = document.getElementById('submitBtn');
    const resendBtn = document.getElementById('resendBtn');

    if (!emailInput || !getOtpBtn || !loginForm) return;

    let currentEmail = '';

    function collectOtp() {
        const inputs = otpSection ? otpSection.querySelectorAll('.otp-input') : [];
        let code = '';
        inputs.forEach((i) => (code += (i.value || '').replace(/[^0-9]/g, '')));
        return code;
    }

    async function sendOtp(email) {
        try {
            const resp = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.message || 'Failed to send OTP');
            }
            return data;
        } catch (error) {
            throw new Error(error.message || 'Unable to reach the server.');
        }
    }

    async function verifyOtp(email, otp) {
        try {
            const resp = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.message || 'Invalid OTP');
            }
            return data;
        } catch (error) {
            throw new Error(error.message || 'Unable to verify OTP.');
        }
    }

    getOtpBtn.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        if (!email) {
            alert('Please enter your email');
            emailInput.focus();
            return;
        }

        getOtpBtn.disabled = true;
        getOtpBtn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">refresh</span> Sending...';

        try {
            await sendOtp(email);
            currentEmail = email;
            if (otpSection) otpSection.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');
            getOtpBtn.classList.add('hidden');

            const firstOtp = otpSection.querySelector('.otp-input');
            if (firstOtp) firstOtp.focus();
        } catch (err) {
            alert(err.message);
        } finally {
            getOtpBtn.disabled = false;
            getOtpBtn.textContent = 'Verify Identity';
        }
    });

    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            if (!currentEmail) return;
            resendBtn.disabled = true;
            resendBtn.textContent = 'Sending...';
            try {
                await sendOtp(currentEmail);
                alert('OTP resent successfully');
            } catch (e) {
                alert(e.message);
            } finally {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Resend?';
            }
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = currentEmail || (emailInput.value || '').trim();
        const otp = collectOtp();

        if (!email) {
            alert('Please enter your email');
            return;
        }
        if (!otp || otp.length !== 6) {
            alert('Please enter the complete 6-digit OTP');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">refresh</span> Verifying...';

        try {
            const data = await verifyOtp(email, otp);

            // CRITICAL: Check for Admin Role
            if (data.role !== 'admin' && data.role !== 'super_admin') {
                throw new Error('Access Denied: You do not have administrator privileges.');
            }

            // Save admin state
            localStorage.setItem('adminToken', data.access_token);
            localStorage.setItem('accessToken', data.access_token); // Set for AuthGuard
            localStorage.setItem('adminEmail', email); // Use distinct keys for admin
            if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);

            // Also save as user for shared components if needed, but maybe better to keep separate?
            // For now, let's keep it separate to avoid pollution.

            window.location.href = 'admin-dashboard.html';

        } catch (err) {
            alert(err.message);
            if (err.message.includes('Access Denied')) {
                // Clear any partial state
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminEmail');
                // Stay/redirect to the admin login page (do not send to user homepage)
                window.location.href = 'admin-login.html';
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-lg">lock_open</span> Access Dashboard';
        }
    });

})();
