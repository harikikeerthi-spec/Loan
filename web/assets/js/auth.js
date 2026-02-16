// Authentication utility functions

function isUserLoggedIn() {
    return localStorage.getItem('accessToken') !== null;
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
}

function getUserId() {
    return localStorage.getItem('userId');
}

function saveUserData(email, accessToken, userId) {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('accessToken', accessToken);
    if (userId) {
        localStorage.setItem('userId', userId);
    }
}

function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');

    // Redirect to user login page
    window.location.href = 'login.html';
}

function updateNavbarAuth() {
    const loginLink = document.getElementById('loginLink');
    const userProfileSection = document.getElementById('userProfileSection');
    const userEmail = document.getElementById('userEmail');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!loginLink && !userProfileSection) {
        console.warn('[Auth] Navbar elements not found. Will retry or wait for components-loader.');
        return;
    }

    const loggedIn = isUserLoggedIn();
    const email = getUserEmail();

    if (loggedIn && email) {
        // User is logged in
        if (loginLink) loginLink.classList.add('hidden');
        if (userProfileSection) {
            userProfileSection.classList.remove('hidden');
            userProfileSection.classList.add('flex');
        }
        if (userEmail) userEmail.textContent = email;
        if (dropdownEmail) dropdownEmail.textContent = email;
    } else {
        // User is not logged in
        if (loginLink) loginLink.classList.remove('hidden');
        if (userProfileSection) {
            userProfileSection.classList.add('hidden');
            userProfileSection.classList.remove('flex');
        }
    }

    // Setup dropdown toggle
    if (profileBtn && profileDropdown && !profileBtn.dataset.listenerAdded) {
        profileBtn.dataset.listenerAdded = 'true';
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.classList.contains('hidden');

            if (isHidden) {
                // Show dropdown
                profileDropdown.classList.remove('hidden');
                setTimeout(() => {
                    profileDropdown.classList.remove('scale-95', 'opacity-0');
                    profileDropdown.classList.add('scale-100', 'opacity-100');
                }, 10);
            } else {
                // Hide dropdown
                profileDropdown.classList.remove('scale-100', 'opacity-100');
                profileDropdown.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    profileDropdown.classList.add('hidden');
                }, 200);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('scale-100', 'opacity-100');
                    profileDropdown.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => {
                        profileDropdown.classList.add('hidden');
                    }, 200);
                }
            }
        });
    }

    // Setup logout functionality
    if (logoutBtn && !logoutBtn.dataset.listenerAdded) {
        logoutBtn.dataset.listenerAdded = 'true';
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            AuthGuard.logout();
        });
    }

    // Setup "Join Community" button
    const joinCommunityBtn = document.getElementById('joinCommunityBtn');
    if (joinCommunityBtn && !joinCommunityBtn.dataset.listenerAdded) {
        joinCommunityBtn.dataset.listenerAdded = 'true';
        joinCommunityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Check if user is logged in
            if (isUserLoggedIn()) {
                // Redirect to community/explore page
                window.location.href = 'explore.html';
            } else {
                // Redirect to signup page
                window.location.href = 'signup.html';
            }
        });
    }
}

// Initialize on page load (standard non-component fallback)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbarAuth);
} else {
    updateNavbarAuth();
}
