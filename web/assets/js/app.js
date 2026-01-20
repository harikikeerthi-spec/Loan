// Initialize Theme
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
    }
});

// Dynamic Component Injection
async function loadComponent(id, url) {
    const container = document.getElementById(id);
    if (!container) return;
    try {
        const response = await fetch(url);
        const html = await response.text();
        container.innerHTML = html;

        // Post-load initialization (e.g., active link highlighting)
        if (id === 'header-root') {
            highlightActiveLink();
        }
    } catch (error) {
        console.error(`Failed to load component from ${url}:`, error);
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('#mainNav a');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('text-primary');
            link.classList.remove('text-gray-600', 'dark:text-gray-400', 'text-[#140d1c]/60');
        }
    });
}

// API Base URL
const API_URL = 'http://localhost:3000';

// Handle Login with OTP
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    const getOtpBtn = document.getElementById('getOtpBtn');
    const submitBtn = document.getElementById('submitBtn');
    const otpSection = document.getElementById('otpSection');
    const emailInput = document.getElementById('email');
    const resendBtn = document.getElementById('resendBtn');

    if (getOtpBtn) {
        getOtpBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            if (!email) {
                alert('Please enter your email');
                return;
            }
            
            getOtpBtn.disabled = true;
            getOtpBtn.textContent = 'Checking...';

            try {
                console.log('Sending OTP to:', email);
                console.log('API URL:', API_URL);
                
                // Send OTP for login
                const response = await fetch(`${API_URL}/auth/login/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                console.log('Send OTP response status:', response.status);
                
                const responseData = await response.json();
                console.log('Send OTP response data:', responseData);

                // Check if user needs to signup first
                if (responseData.success === false) {
                    alert(responseData.message);
                    if (responseData.redirect === 'signup') {
                        window.location.href = 'signup.html';
                        return;
                    }
                    getOtpBtn.disabled = false;
                    getOtpBtn.textContent = 'Get OTP';
                    return;
                }
                
                if (!response.ok) {
                    throw new Error('Failed to send OTP: ' + (responseData.message || response.statusText));
                }

                alert('OTP sent to your email! Check the backend terminal for the OTP.');
                otpSection.classList.remove('hidden');
                getOtpBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
                
                // Focus first OTP input
                const otpInputsLogin = document.querySelectorAll('.otp-input');
                if (otpInputsLogin.length > 0) {
                    otpInputsLogin[0].focus();
                }
            } catch (error) {
                console.error('Error details:', error);
                alert('Error: ' + error.message + '\n\nMake sure backend is running on http://localhost:3000');
                getOtpBtn.disabled = false;
                getOtpBtn.textContent = 'Get OTP';
            }
        });

        if (resendBtn) {
            resendBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                
                try {
                    const response = await fetch(`${API_URL}/auth/login/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
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

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const otpInputs = document.querySelectorAll('.otp-input');
        let otp = '';
        otpInputs.forEach(input => otp += input.value);

        if (otp.length !== 6) {
            alert('Please enter a 6-digit OTP');
            return;
        }

        try {
            console.log('Verifying OTP for:', email);
            const response = await fetch(`${API_URL}/auth/login/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            console.log('Login response status:', response.status);
            const responseData = await response.json();
            console.log('Login response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Invalid OTP');
            }

            const data = responseData;
            console.log('Login successful, saving token and email');
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('userEmail', email);
            if (data.username) {
                localStorage.setItem('username', data.username);
            }
            
            // Update navbar to show user profile
            if (typeof updateNavbarAuth === 'function') {
                updateNavbarAuth();
            }
            
            alert('Login Successful!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Invalid OTP or Login Failed: ' + error.message);
        }
    });
}
