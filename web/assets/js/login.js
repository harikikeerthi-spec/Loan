// Login page email + OTP flow using unified auth endpoints
const API_URL = 'http://localhost:3000';

(function initLogin() {
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
  }

  async function verifyOtp(email, otp) {
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
  }

  // Get OTP button
  getOtpBtn.addEventListener('click', async () => {
    const email = (emailInput.value || '').trim();
    if (!email) {
      alert('Please enter your email');
      emailInput.focus();
      return;
    }

    getOtpBtn.disabled = true;
    getOtpBtn.textContent = 'Sending...';
    try {
      await sendOtp(email);
      currentEmail = email;
      if (otpSection) otpSection.classList.remove('hidden');
      if (submitBtn) submitBtn.classList.remove('hidden');
      getOtpBtn.classList.add('hidden');
      // focus first OTP box
      const firstOtp = otpSection.querySelector('.otp-input');
      if (firstOtp) firstOtp.focus();
    } catch (err) {
      alert(err.message);
    } finally {
      getOtpBtn.disabled = false;
      getOtpBtn.textContent = 'Get OTP';
    }
  });

  // Resend OTP
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (!currentEmail) return;
      resendBtn.disabled = true;
      try {
        await sendOtp(currentEmail);
        alert('OTP resent');
      } catch (e) {
        alert(e.message);
      } finally {
        resendBtn.disabled = false;
      }
    });
  }

  // Submit (verify) OTP
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = currentEmail || (emailInput.value || '').trim();
    const otp = collectOtp();
    if (!email) {
      alert('Please enter your email');
      emailInput.focus();
      return;
    }
    if (!otp || otp.length !== 6) {
      alert('Please enter the 6-digit OTP');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
      const data = await verifyOtp(email, otp);

      // Save user state
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('userEmail', email);
      if (data.firstName) localStorage.setItem('firstName', data.firstName);
      if (data.lastName) localStorage.setItem('lastName', data.lastName);

      // Update navbar immediately if available
      if (typeof updateNavbarAuth === 'function') updateNavbarAuth();

      // Route per flags
      if (!data.userExists || !data.hasUserDetails) {
        window.location.href = 'user-details.html';
      } else {
        window.location.href = 'index.html';
      }
    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
})();
