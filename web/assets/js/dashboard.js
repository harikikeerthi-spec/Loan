// User Dashboard API Integration
const API_URL = 'http://localhost:3000';

// Load user dashboard data
async function loadUserDashboard() {
    const userEmail = localStorage.getItem('userEmail');
    const accessToken = localStorage.getItem('accessToken');

    if (!userEmail || !accessToken) {
        console.log('No user logged in, redirecting to login...');
        // User not logged in, redirect to login page
        window.location.href = 'login.html';
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
            displayUserInfo(data.user);
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
    // Update user profile section
    const userEmailElement = document.getElementById('userEmail');
    const dropdownEmailElement = document.getElementById('dropdownEmail');

    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }

    if (dropdownEmailElement) {
        dropdownEmailElement.textContent = user.email;
    }

    // Show user profile section and hide login/signup buttons
    const userProfileSection = document.getElementById('userProfileSection');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');

    if (userProfileSection) {
        userProfileSection.classList.remove('hidden');
        userProfileSection.classList.add('flex');
    }

    if (loginLink) {
        loginLink.classList.add('hidden');
    }

    if (signupLink) {
        signupLink.classList.add('hidden');
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

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', function () {
    loadUserDashboard();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadUserDashboard, displayUserInfo };
}
