// API Base URL
const API_URL = 'http://localhost:3000';

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const getOtpSignupBtn = document.getElementById('getOtpSignupBtn');
    const submitBtn = document.getElementById('submitBtn');
    const otpSection = document.getElementById('otpSection');
    const signupEmailInput = document.getElementById('signupEmail');
    const usernameInput = document.getElementById('username');
    const resendSignupBtn = document.getElementById('resendSignupBtn');

    if (getOtpSignupBtn) {
        getOtpSignupBtn.addEventListener('click', async () => {
            const email = signupEmailInput.value.trim();
            const username = usernameInput.value.trim();
            
            if (!email) {
                alert('Please enter your email');
                return;
            }
            
            if (!username) {
                alert('Please enter your username');
                return;
            }
            
            getOtpSignupBtn.disabled = true;
            getOtpSignupBtn.textContent = 'Checking...';

            try {
                console.log('Sending OTP request to:', `${API_URL}/auth/register/send-otp`);
                const response = await fetch(`${API_URL}/auth/register/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, username }),
                });

                console.log('Response status:', response.status);
                const responseData = await response.json();
                console.log('Response data:', responseData);

                // Check if user already exists
                if (responseData.success === false) {
                    alert(responseData.message);
                    if (responseData.redirect === 'login') {
                        window.location.href = 'login.html';
                        return;
                    }
                    getOtpSignupBtn.disabled = false;
                    getOtpSignupBtn.textContent = 'Get OTP';
                    return;
                }

                if (!response.ok) throw new Error('Failed to send OTP: ' + (responseData.message || response.statusText));

                alert('OTP sent to your email!');
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
                alert('Error sending OTP: ' + error.message);
                getOtpSignupBtn.disabled = false;
                getOtpSignupBtn.textContent = 'Get OTP';
            }
        });

        if (resendSignupBtn) {
            resendSignupBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = signupEmailInput.value.trim();
                
                try {
                    const username = usernameInput.value.trim();
                    const response = await fetch(`${API_URL}/auth/register/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, username }),
                    });

                    if (!response.ok) throw new Error('Failed to resend OTP');

                    alert('OTP resent to your email!');
                    
                    // Clear OTP inputs
                    const otpInputs = document.querySelectorAll('.otp-input');
                    otpInputs.forEach(input => input.value = '');
                    if (otpInputs.length > 0) {
                        otpInputs[0].focus();
                    }
                } catch (error) {
                    alert('Error resending OTP');
                    console.error(error);
                }
            });
        }
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupEmailInput.value.trim();
        const username = usernameInput.value.trim();
        const otpInputs = document.querySelectorAll('.otp-input');
        let otp = '';
        otpInputs.forEach(input => otp += input.value);

        if (otp.length !== 6) {
            alert('Please enter a valid 6-digit OTP');
            return;
        }

        if (!username) {
            alert('Please enter your username');
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
            localStorage.setItem('username', data.username || username);
            
            console.log('Signup successful! Data saved:', {
                accessToken: localStorage.getItem('accessToken'),
                userEmail: localStorage.getItem('userEmail'),
                username: localStorage.getItem('username')
            });
            
            alert('Account created successfully! Redirecting to dashboard...');
            
            // Use setTimeout to ensure localStorage is written before redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        } catch (error) {
            console.error('Error details:', error);
            alert('Invalid OTP or Signup Failed: ' + error.message);
        }
    });
}
