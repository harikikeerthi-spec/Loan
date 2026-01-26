// User Dashboard API Integration
const API_URL = 'http://localhost:3000';

// Pages that don't require authentication (public pages)
const publicPages = [
    'index.html',
    'login.html',
    'signup.html',
    'about-us.html',
    'contact.html',
    'faq.html',
    'how-it-works.html',
    'emi.html',
    'bank-reviews.html',
    'privacy-policy.html',
    'terms-conditions.html',
    'cookies.html',
    'eligibility.html',
    ''  // Root path
];

// Check if current page is a public page
function isPublicPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    return publicPages.includes(currentPage);
}

// Get user full name from localStorage
function getUserName() {
    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';
    return `${firstName} ${lastName}`.trim() || localStorage.getItem('userEmail') || 'User';
}

// Load user dashboard data
async function loadUserDashboard() {
    const userEmail = localStorage.getItem('userEmail');
    const accessToken = localStorage.getItem('accessToken');

    if (!userEmail || !accessToken) {
        console.log('No user logged in');
        // Only redirect to login on protected pages, not on public pages
        if (!isPublicPage()) {
            console.log('On protected page, redirecting to login...');
            window.location.href = 'login.html';
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/dashboard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ email: userEmail })
        });

        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();

        if (data.success) {
            // Store user data in localStorage for use across pages
            const user = data.user;
            localStorage.setItem('firstName', user.firstName || '');
            localStorage.setItem('lastName', user.lastName || '');
            localStorage.setItem('userPhoneNumber', user.phoneNumber || '');
            localStorage.setItem('userDateOfBirth', user.dateOfBirth || '');
            
            displayUserInfo(user);
            setupProfileDropdown();
            return data.user;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // If error, might be invalid token, redirect to login
        // localStorage.clear();
        // window.location.href = 'login.html';
    }
}

// Display user information on the dashboard
function displayUserInfo(user) {
    // Update user profile section - show user's name or email
    const userEmailElement = document.getElementById('userEmail');
    const dropdownEmailElement = document.getElementById('dropdownEmail');
    const dropdownNameElement = document.getElementById('dropdownName');

    const displayName = user.firstName && user.lastName ? 
        `${user.firstName} ${user.lastName}` : user.email;

    if (userEmailElement) {
        userEmailElement.textContent = displayName;
    }

    if (dropdownEmailElement) {
        dropdownEmailElement.textContent = user.email;
    }

    if (dropdownNameElement) {
        dropdownNameElement.textContent = displayName;
    }

    // Show user profile section and hide login/signup buttons
    const userProfileSection = document.getElementById('userProfileSection');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const registerLink = document.getElementById('registerLink');

    if (userProfileSection) {
        userProfileSection.classList.remove('hidden');
        userProfileSection.style.display = 'flex';
    }

    if (loginLink) {
        loginLink.classList.add('hidden');
        loginLink.style.display = 'none';
    }

    if (signupLink) {
        signupLink.classList.add('hidden');
        signupLink.style.display = 'none';
    }

    if (registerLink) {
        registerLink.classList.add('hidden');
        registerLink.style.display = 'none';
    }

    // Display user details in console for debugging
    console.log('User Dashboard Data:', {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber,
        dob: user.dateOfBirth,
        memberSince: new Date(user.createdAt).toLocaleDateString()
    });
}

// Setup profile dropdown functionality
function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn && profileDropdown) {
        // Toggle dropdown on button click
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Profile button clicked');
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // Setup logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout clicked');
            logout();
        });
    }
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', function () {
    loadUserDashboard();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadUserDashboard, displayUserInfo, setupProfileDropdown, logout, getUserName };
}
