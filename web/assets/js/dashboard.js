// User Dashboard API Integration
const API_URL = 'http://localhost:3000/api';

// Pages that don't require authentication (public pages)
const publicPages = [
    'index.html',
    'login.html',
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
    'explore.html',
    'engage.html',
    'blog.html',
    'community-events.html',
    'community-mentorship.html',
    'community-resources.html',
    'community-success-stories.html',
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
    const userId = localStorage.getItem('userId');
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
            localStorage.setItem('userId', user.id);
            localStorage.setItem('firstName', user.firstName || '');
            localStorage.setItem('lastName', user.lastName || '');
            localStorage.setItem('userPhoneNumber', user.phoneNumber || '');
            localStorage.setItem('userDateOfBirth', user.dateOfBirth || '');

            displayUserInfo(user);
            setupProfileDropdown();

            // Load dashboard dynamic data
            if (userId || user.id) {
                await loadDynamicDashboardData(user.id || userId);
            }

            return data.user;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // If error, might be invalid token, redirect to login
        // localStorage.clear();
        // window.location.href = 'login.html';
    }
}

// Load dynamic dashboard data from database
async function loadDynamicDashboardData(userId) {
    const accessToken = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`${API_URL}/auth/dashboard-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();

        if (data.success && window.dashboardData) {
            // Update dashboard with database data
            window.dashboardData.applications = data.data.applications || [];
            window.dashboardData.documents = convertDocumentsToFormat(data.data.documents || []);
            window.dashboardData.activity = data.data.activity || [];

            // Save to localStorage so activity persists
            if (typeof saveDashboardData === 'function') {
                saveDashboardData();
            }

            // Render the updated dashboard
            if (typeof renderDashboard === 'function') {
                renderDashboard();
            }

            // Update Progress Tracker
            if (window.progressTracker && typeof window.progressTracker.updateFromDashboardData === 'function') {
                window.progressTracker.updateFromDashboardData(window.dashboardData);
            }

            console.log('Dashboard data loaded from database');
        }
    } catch (error) {
        console.error('Error loading dynamic dashboard data:', error);
    }
}

// Convert documents from database format to UI format
function convertDocumentsToFormat(dbDocuments) {
    const docFormat = {
        aadhar: { uploaded: false, status: 'pending' },
        pan: { uploaded: false, status: 'pending' },
        passport: { uploaded: false, status: 'pending' },
        '10th': { uploaded: false, status: 'pending' },
        '12th': { uploaded: false, status: 'pending' },
        degree: { uploaded: false, status: 'pending' },
    };

    dbDocuments.forEach(doc => {
        if (docFormat.hasOwnProperty(doc.docType)) {
            docFormat[doc.docType] = {
                uploaded: doc.uploaded,
                status: doc.status
            };
        }
    });

    return docFormat;
}

// Display user information on the dashboard
function displayUserInfo(user) {
    // Update user profile section - show user's name or email
    const userEmailElement = document.getElementById('userEmail');
    const dropdownEmailElement = document.getElementById('dropdownEmail');
    const dropdownNameElement = document.getElementById('dropdownName');
    const profileHeaderSection = document.getElementById('profileHeaderSection');
    const profileBtn = document.getElementById('profileBtn');

    const displayName = user.firstName && user.lastName ?
        `${user.firstName} ${user.lastName}` : user.email;

    console.log('displayUserInfo called with user:', user);
    console.log('Display name:', displayName);

    // Update profile button text
    if (userEmailElement) {
        userEmailElement.textContent = displayName;
        console.log('Updated userEmail element:', userEmailElement.textContent);
    } else {
        console.log('userEmailElement not found');
    }

    if (dropdownEmailElement) {
        dropdownEmailElement.textContent = user.email;
    }

    if (dropdownNameElement) {
        dropdownNameElement.textContent = displayName;
    }

    // Ensure profile button is visible
    if (profileBtn) {
        profileBtn.style.opacity = '1';
        profileBtn.style.visibility = 'visible';
        profileBtn.style.display = 'flex';
    }

    // Show profile header section when user is logged in
    if (profileHeaderSection) {
        profileHeaderSection.classList.remove('hidden');
        profileHeaderSection.style.display = 'block';
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

    // Guard to avoid double-binding if auth.js already attached listeners
    if (profileBtn && profileDropdown && !(profileBtn.dataset.listenerAdded === 'true' || profileBtn.dataset.dropdownListenerAdded === 'true')) {
        // mark both flags so either script recognizes it's bound
        profileBtn.dataset.dropdownListenerAdded = 'true';
        profileBtn.dataset.listenerAdded = 'true';

        // Toggle dropdown on button click
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Profile button clicked');
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside (bind once)
        if (!document.body.dataset.dropdownOutsideListenerAdded) {
            document.body.dataset.dropdownOutsideListenerAdded = 'true';
            document.addEventListener('click', (e) => {
                if (profileDropdown && !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }
    }

    // Setup logout button (guarded, check both flags used across scripts)
    if (logoutBtn && !(logoutBtn.dataset.logoutListenerAdded === 'true' || logoutBtn.dataset.listenerAdded === 'true')) {
        logoutBtn.dataset.logoutListenerAdded = 'true';
        logoutBtn.dataset.listenerAdded = 'true';
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout clicked');
            logout();
        });
    }
}

// Create new loan application via API
async function createLoanApplicationAPI(bank, loanType, amount, purpose) {
    const userId = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('accessToken');

    if (!userId || !accessToken) {
        console.error('User not logged in');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/create-application`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                userId,
                bank,
                loanType,
                amount: parseFloat(amount),
                purpose
            })
        });

        const data = await response.json();

        if (data.success) {
            // Add to local dashboard data and render
            if (window.dashboardData) {
                window.dashboardData.applications.push(data.application);
                addActivity('new_application', `${bank} - ${formatLoanType(loanType)} Application`, purpose || 'No description');
                saveDashboardData();
                renderDashboard();
            }
            return true;
        } else {
            console.error('Failed to create application:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error creating application:', error);
        return false;
    }
}

// Delete application via API
async function deleteApplicationAPI(appId, index) {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        console.error('User not logged in');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/application/${appId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Remove from local dashboard data
            if (window.dashboardData && index >= 0) {
                const app = window.dashboardData.applications[index];
                window.dashboardData.applications.splice(index, 1);
                addActivity('delete', 'Application Deleted', `${app.bank} - ${formatLoanType(app.loanType)}`);
                saveDashboardData();
                renderDashboard();
            }
            return true;
        } else {
            console.error('Failed to delete application:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error deleting application:', error);
        return false;
    }
}

// Upload document via API
async function uploadDocumentAPI(docType) {
    const userId = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('accessToken');

    if (!userId || !accessToken) {
        console.error('User not logged in');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/upload-document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                userId,
                docType,
                uploaded: true,
                filePath: null
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update local dashboard data
            if (window.dashboardData && window.dashboardData.documents[docType]) {
                window.dashboardData.documents[docType].uploaded = true;
                window.dashboardData.documents[docType].status = 'uploaded';
                addActivity('upload', 'Document Uploaded', docType);
                saveDashboardData();
                renderDashboard();
            }
            return true;
        } else {
            console.error('Failed to upload document:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        return false;
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

// Add activity to the local activity feed
function addActivity(type, title, description) {
    if (!window.dashboardData) return;
    if (!Array.isArray(window.dashboardData.activity)) {
        window.dashboardData.activity = [];
    }
    window.dashboardData.activity.unshift({
        type: type,
        title: title,
        description: description,
        timestamp: new Date().toISOString()
    });
    // Keep only last 20 activities
    if (window.dashboardData.activity.length > 20) {
        window.dashboardData.activity = window.dashboardData.activity.slice(0, 20);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadUserDashboard, displayUserInfo, setupProfileDropdown, logout, getUserName, createLoanApplicationAPI, deleteApplicationAPI, uploadDocumentAPI, addActivity }
};


