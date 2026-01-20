// Authentication utility functions

function isUserLoggedIn() {
    return localStorage.getItem('accessToken') !== null;
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
}

function getUsername() {
    return localStorage.getItem('username');
}

function saveUserData(email, accessToken) {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('accessToken', accessToken);
}

function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
}

function updateNavbarAuth() {
    const signupLink = document.getElementById('signupLink');
    const loginLink = document.getElementById('loginLink');
    const userProfileSection = document.getElementById('userProfileSection');
    const userEmail = document.getElementById('userEmail');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    console.log('Auth check - isLoggedIn:', isUserLoggedIn(), 'email:', getUserEmail());

    if (isUserLoggedIn()) {
        // User is logged in - hide auth links, show profile
        if (signupLink) signupLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'none';
        if (userProfileSection) {
            userProfileSection.classList.remove('hidden');
            userProfileSection.style.display = 'flex';
        }
        
        const email = getUserEmail();
        if (userEmail) userEmail.textContent = email;
        if (dropdownEmail) dropdownEmail.textContent = email;
        console.log('User logged in, showing profile for:', email);
    } else {
        // User is not logged in - show auth links, hide profile
        if (signupLink) signupLink.style.display = '';
        if (loginLink) loginLink.style.display = '';
        if (userProfileSection) {
            userProfileSection.classList.add('hidden');
            userProfileSection.style.display = 'none';
        }
        console.log('User not logged in, showing auth links');
    }

    // Toggle dropdown
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            profileDropdown.classList.add('hidden');
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbarAuth);
} else {
    updateNavbarAuth();
}
