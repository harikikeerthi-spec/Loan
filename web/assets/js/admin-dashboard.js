// Admin Dashboard JavaScript
// Note: API_BASE_URL is defined in blog-api.js (loaded before this script)
let currentEditBlogId = null;
let adminToken = null;
let adminData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Dashboard Loading...');
    checkAdminAuth();
    loadDashboardStats();

    // Pre-load all tabs to make everything visible
    console.log('📊 Pre-loading all tabs...');
    setTimeout(() => {
        loadBlogs();
        loadUsers();
        loadCommunityData('mentorship');
        console.log('✅ All tabs loaded!');
    }, 500);

    setupEventListeners();
});

// Check Admin Authentication
function checkAdminAuth() {
    let token = localStorage.getItem('adminToken');
    let email = localStorage.getItem('userEmail');

    // FOR TESTING: Auto-set demo credentials if not logged in
    if (!token) {
        console.log('⚠️ No admin token found. Using DEMO mode for testing.');
        token = 'demo-admin-token-' + Date.now();
        email = 'demo-admin@loanhero.com';

        // Store demo credentials
        localStorage.setItem('adminToken', token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('lastLogin', new Date().toISOString());

        console.log('✅ Demo admin credentials set. You can now view the admin panel.');
        console.log('⚠️ Note: Some admin-only API endpoints might fail without real authentication.');
    }

    adminToken = token;
    document.getElementById('adminName').textContent = email || 'Admin';
    document.getElementById('settingsEmail').value = email || '';
    document.getElementById('lastLogin').value = new Date(localStorage.getItem('lastLogin') || new Date()).toLocaleString();
}

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-container').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('active');
    }

    // Add active class to clicked nav item
    event.target.closest('.admin-nav-item')?.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'blogs': 'Blog Management',
        'create': 'Create Blog',
        'users': 'User Management',
        'community': 'Community Management',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Admin Panel';

    // Load data if needed
    if (tabName === 'blogs') {
        loadBlogs();
    } else if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'community') {
        loadCommunityData('mentorship'); // Load mentorship by default
    }
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        // Try admin stats endpoint first
        let response = await fetch(`${API_BASE_URL}/blogs/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                document.getElementById('totalBlogs').textContent = data.data.total || 0;
                document.getElementById('publishedBlogs').textContent = data.data.published || 0;
                document.getElementById('draftBlogs').textContent = data.data.draft || 0;
                document.getElementById('totalViews').textContent = (data.data.totalViews || 0).toLocaleString();
                return;
            }
        }

        // Fallback: Calculate stats from actual blog data
        console.log('Admin stats not available, calculating from blog data...');

        response = await fetch(`${API_BASE_URL}/blogs`);
        if (response.ok) {
            const data = await response.json();
            const blogs = data.data || [];

            const published = blogs.filter(b => b.status === 'published').length;
            const draft = blogs.filter(b => b.status === 'draft').length;
            const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);

            document.getElementById('totalBlogs').textContent = blogs.length;
            document.getElementById('publishedBlogs').textContent = published;
            document.getElementById('draftBlogs').textContent = draft;
            document.getElementById('totalViews').textContent = totalViews.toLocaleString();

            console.log(`✅ Stats calculated: ${blogs.length} total, ${published} published, ${draft} drafts`);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set defaults
        document.getElementById('totalBlogs').textContent = '0';
        document.getElementById('publishedBlogs').textContent = '0';
        document.getElementById('draftBlogs').textContent = '0';
        document.getElementById('totalViews').textContent = '0';
    }
}

// Load Blogs
async function loadBlogs() {
    try {
        const searchTerm = document.getElementById('searchBlogs')?.value || '';
        const filterStatus = document.getElementById('filterStatus')?.value || '';

        const response = await fetch(`${API_BASE_URL}/blogs/admin/all`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                let blogs = data.data || [];

                // Filter by search term
                if (searchTerm) {
                    blogs = blogs.filter(blog =>
                        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                // Filter by status
                if (filterStatus === 'published') {
                    blogs = blogs.filter(blog => blog.isPublished);
                } else if (filterStatus === 'draft') {
                    blogs = blogs.filter(blog => !blog.isPublished);
                }

                displayBlogs(blogs);
            }
        } else if (response.status === 401) {
            showError('Session expired. Please login again.');
            redirectToLogin();
        }
    } catch (error) {
        console.error('Error loading blogs:', error);
        showError('Failed to load blogs');
    }
}

// Display Blogs in Table
function displayBlogs(blogs) {
    const blogsList = document.getElementById('blogsList');

    if (blogs.length === 0) {
        blogsList.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    No blogs found. <a href="#" onclick="switchTab('create'); return false;" class="text-primary hover:underline">Create one</a>
                </td>
            </tr>
        `;
        return;
    }

    blogsList.innerHTML = blogs.map(blog => `
        <tr>
            <td class="px-6 py-4">
                <div>
                    <p class="font-medium">${escapeHtml(blog.title)}</p>
                    <p class="text-sm text-gray-500">${escapeHtml(blog.slug)}</p>
                </div>
            </td>
            <td class="px-6 py-4">${escapeHtml(blog.authorName)}</td>
            <td class="px-6 py-4">
                <span class="status-badge status-${blog.isPublished ? 'published' : 'draft'}">
                    ${blog.isPublished ? 'Published' : 'Draft'}
                </span>
            </td>
            <td class="px-6 py-4">${(blog.views || 0).toLocaleString()}</td>
            <td class="px-6 py-4">${new Date(blog.updatedAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-2">
                    <button onclick="viewBlog('${blog.id}')" title="View Blog"
                        class="material-symbols-outlined text-lg cursor-pointer text-green-600 hover:text-green-800">
                        visibility
                    </button>
                    <button onclick="openEditModal('${blog.id}')" title="Edit"
                        class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800">
                        edit
                    </button>
                    <button onclick="deleteBlog('${blog.id}')" title="Delete"
                        class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">
                        delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load Users
async function loadUsers() {
    try {
        // This would typically come from your users API endpoint
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    User management functionality coming soon.
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Handle Create Blog Form
async function handleCreateBlog(event) {
    event.preventDefault();

    const blogData = {
        title: document.getElementById('blogTitle').value,
        slug: document.getElementById('blogSlug').value,
        excerpt: document.getElementById('excerpt').value,
        content: document.getElementById('content').value,
        authorName: document.getElementById('authorName').value,
        category: document.getElementById('category').value,
        featuredImage: document.getElementById('featuredImage').value || null,
        readTime: parseInt(document.getElementById('readTime').value) || 5,
        isFeatured: document.getElementById('isFeatured').checked,
        isPublished: document.getElementById('isPublished').checked,
        tags: document.getElementById('tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/blogs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(blogData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Blog created successfully!');
            document.getElementById('createBlogForm').reset();
            setTimeout(() => {
                switchTab('blogs');
                loadBlogs();
            }, 1500);
        } else {
            showError(result.message || 'Failed to create blog');
        }
    } catch (error) {
        console.error('Error creating blog:', error);
        showError('Error creating blog');
    }
}

// Open Edit Modal
async function openEditModal(blogId) {
    try {
        // Fetch the blog details
        const response = await fetch(`${API_BASE_URL}/blogs/admin/all`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const blog = data.data.find(b => b.id === blogId);

            if (blog) {
                currentEditBlogId = blogId;
                document.getElementById('editBlogTitle').value = blog.title;
                document.getElementById('editCategory').value = blog.category;
                document.getElementById('editExcerpt').value = blog.excerpt;
                document.getElementById('editIsFeatured').checked = blog.isFeatured;
                document.getElementById('editIsPublished').checked = blog.isPublished;

                document.getElementById('editBlogModal').classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showError('Failed to load blog details');
    }
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('editBlogModal').classList.remove('active');
    currentEditBlogId = null;
}

// Handle Edit Blog Form
async function handleEditBlog(event) {
    event.preventDefault();

    const updateData = {
        title: document.getElementById('editBlogTitle').value,
        category: document.getElementById('editCategory').value,
        excerpt: document.getElementById('editExcerpt').value,
        isFeatured: document.getElementById('editIsFeatured').checked,
        isPublished: document.getElementById('editIsPublished').checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${currentEditBlogId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Blog updated successfully!');
            closeEditModal();
            loadBlogs();
        } else {
            showError(result.message || 'Failed to update blog');
        }
    } catch (error) {
        console.error('Error updating blog:', error);
        showError('Error updating blog');
    }
}

// Delete Blog
async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Blog deleted successfully!');
            loadBlogs();
        } else {
            showError(result.message || 'Failed to delete blog');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        showError('Error deleting blog');
    }
}

// Switch between community sub-tabs
function switchCommunityTab(subTab) {
    // Hide all community sub-tabs
    document.querySelectorAll('.community-sub-tab').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all community tab buttons
    document.querySelectorAll('.community-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected sub-tab
    const tab = document.getElementById(`${subTab}-tab`);
    if (tab) {
        tab.style.display = 'block';
    }

    // Add active class to clicked button
    event.target.closest('.community-tab-button')?.classList.add('active');

    // Load data for the selected sub-tab
    loadCommunityData(subTab);
}

// Load Community Data
async function loadCommunityData(dataType) {
    try {
        switch (dataType) {
            case 'mentorship':
                await loadMentors();
                break;
            case 'events':
                await loadEvents();
                break;
            case 'stories':
                await loadSuccessStories();
                break;
            case 'resources':
                await loadResources();
                break;
        }
    } catch (error) {
        console.error('Error loading community data:', error);
    }
}

// Load Mentors
async function loadMentors() {
    try {
        const response = await fetch(`${API_BASE_URL}/community/mentors`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const mentors = data.data || [];

            document.getElementById('totalMentors').textContent = mentors.length;

            const mentorsList = document.getElementById('mentorsList');
            if (mentors.length === 0) {
                mentorsList.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                            No mentors found. <a href="#" onclick="openCreateMentorModal(); return false;" class="text-primary hover:underline">Add a mentor</a>
                        </td>
                    </tr>
                `;
            } else {
                mentorsList.innerHTML = mentors.map(mentor => `
                    <tr>
                        <td class="px-6 py-4">${escapeHtml(mentor.name)}</td>
                        <td class="px-6 py-4">${escapeHtml(mentor.expertise?.join(', ') || 'N/A')}</td>
                        <td class="px-6 py-4">${mentor.studentsMentored || 0}</td>
                        <td class="px-6 py-4">
                            <span class="status-badge ${mentor.isActive ? 'status-published' : 'status-draft'}">${mentor.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="openEditMentorModal('${mentor.id}')" title="Edit" class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800">edit</button>
                                <button onclick="deleteMentor('${mentor.id}')" title="Delete" class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading mentors:', error);
        document.getElementById('mentorsList').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    Error loading mentors. Please try again.
                </td>
            </tr>
        `;
    }
}

// Load Events
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/community/events`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const events = data.data || [];

            document.getElementById('totalEvents').textContent = events.length;

            const eventsList = document.getElementById('eventsList');
            if (events.length === 0) {
                eventsList.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                            No events found. <a href="#" onclick="openCreateEventModal(); return false;" class="text-primary hover:underline">Add an event</a>
                        </td>
                    </tr>
                `;
            } else {
                eventsList.innerHTML = events.map(event => `
                    <tr>
                        <td class="px-6 py-4">${escapeHtml(event.title)}</td>
                        <td class="px-6 py-4">${new Date(event.date).toLocaleDateString()}</td>
                        <td class="px-6 py-4">${event.registrationCount || 0}</td>
                        <td class="px-6 py-4">
                            <span class="status-badge ${event.isFeatured ? 'status-published' : 'status-draft'}">${event.isFeatured ? 'Featured' : 'Active'}</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="openEditEventModal('${event.id}')" title="Edit" class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800">edit</button>
                                <button onclick="deleteEvent('${event.id}')" title="Delete" class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsList').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    Error loading events. Please try again.
                </td>
            </tr>
        `;
    }
}

// Load Success Stories
async function loadSuccessStories() {
    try {
        const response = await fetch(`${API_BASE_URL}/community/stories`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const stories = data.data || [];

            document.getElementById('totalStories').textContent = stories.length;

            const storiesList = document.getElementById('storiesList');
            if (stories.length === 0) {
                storiesList.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                            No success stories found. <a href="#" onclick="openCreateStoryModal(); return false;" class="text-primary hover:underline">Add a story</a>
                        </td>
                    </tr>
                `;
            } else {
                storiesList.innerHTML = stories.map(story => `
                    <tr>
                        <td class="px-6 py-4">${escapeHtml(story.name)}</td>
                        <td class="px-6 py-4">${escapeHtml(story.university)}</td>
                        <td class="px-6 py-4">₹${(story.loanAmount || 0).toLocaleString()}</td>
                        <td class="px-6 py-4">
                            <span class="status-badge status-published">Published</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="viewStoryDetails('${story.id}')" title="View" class="material-symbols-outlined text-lg cursor-pointer text-green-600 hover:text-green-800">visibility</button>
                                <button onclick="deleteStory('${story.id}')" title="Delete" class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading success stories:', error);
        document.getElementById('storiesList').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    Error loading success stories. Please try again.
                </td>
            </tr>
        `;
    }
}

// Load Resources
async function loadResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/community/resources`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const resources = data.data || [];

            document.getElementById('totalResources').textContent = resources.length;

            const resourcesList = document.getElementById('resourcesList');
            if (resources.length === 0) {
                resourcesList.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                            No resources found. <a href="#" onclick="openCreateResourceModal(); return false;" class="text-primary hover:underline">Add a resource</a>
                        </td>
                    </tr>
                `;
            } else {
                resourcesList.innerHTML = resources.map(resource => `
                    <tr>
                        <td class="px-6 py-4">${escapeHtml(resource.title)}</td>
                        <td class="px-6 py-4">${escapeHtml(resource.type)}</td>
                        <td class="px-6 py-4">${resource.downloadCount || 0}</td>
                        <td class="px-6 py-4">
                            <span class="status-badge ${resource.isFeatured ? 'status-published' : 'status-draft'}">${resource.isFeatured ? 'Featured' : 'Active'}</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="openEditResourceModal('${resource.id}')" title="Edit" class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800">edit</button>
                                <button onclick="deleteResource('${resource.id}')" title="Delete" class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resourcesList').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    Error loading resources. Please try again.
                </td>
            </tr>
        `;
    }
}

// Logout
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Auto-generate slug from title
    const titleInput = document.getElementById('blogTitle');
    const slugInput = document.getElementById('blogSlug');

    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            slugInput.value = e.target.value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        });
    }

    // Search and filter functionality
    const searchInput = document.getElementById('searchBlogs');
    const filterSelect = document.getElementById('filterStatus');
    const searchBtn = document.querySelector('button:has-text("Search")');

    if (searchInput && filterSelect) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadBlogs();
            }
        });

        filterSelect.addEventListener('change', () => {
            loadBlogs();
        });
    }

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
        });
    }

    // Theme toggle
    const themeToggle = document.querySelector('[onclick="toggleTheme()"]');
    if (themeToggle) {
        const isDark = localStorage.getItem('theme') === 'dark';
        if (isDark) {
            document.documentElement.classList.add('dark');
            themeToggle.textContent = 'dark_mode';
        }
    }
}

// Toggle Theme
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const themeToggle = document.querySelector('[onclick="toggleTheme()"]');
    if (themeToggle) {
        themeToggle.textContent = isDark ? 'dark_mode' : 'light_mode';
    }
}

// Clear Cache
function clearCache() {
    if (confirm('Are you sure? This will clear all cached data.')) {
        localStorage.clear();
        showSuccess('Cache cleared. Refreshing page...');
        setTimeout(() => location.reload(), 1500);
    }
}

// Reset Settings
function resetSettings() {
    if (confirm('Are you sure? This will reset all settings to defaults.')) {
        showSuccess('Settings reset. Refreshing page...');
        setTimeout(() => location.reload(), 1500);
    }
}

// Redirect to login
function redirectToLogin() {
    setTimeout(() => {
        window.location.href = 'login.html?redirect=admin-dashboard.html';
    }, 2000);
}

// Utility Functions
function showSuccess(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Create a temporary error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('editBlogModal');
    if (e.target === modal) {
        closeEditModal();
    }
});

// ==================== COMMUNITY MODAL FUNCTIONS ====================

function openCreateMentorModal() {
    showNotification('Create Mentor feature coming soon! For now, use the API directly.', 'info');
    console.log('Open Create Mentor Modal');
}

function openEditMentorModal(mentorId) {
    showNotification('Edit Mentor feature coming soon! For now, use the API directly.', 'info');
    console.log('Edit Mentor:', mentorId);
}

function openCreateEventModal() {
    showNotification('Create Event feature coming soon! For now, use the API directly.', 'info');
    console.log('Open Create Event Modal');
}

function openEditEventModal(eventId) {
    showNotification('Edit Event feature coming soon! For now, use the API directly.', 'info');
    console.log('Edit Event:', eventId);
}

function openCreateResourceModal() {
    showNotification('Create Resource feature coming soon! For now, use the API directly.', 'info');
    console.log('Open Create Resource Modal');
}

function openEditResourceModal(resourceId) {
    showNotification('Edit Resource feature coming soon! For now, use the API directly.', 'info');
    console.log('Edit Resource:', resourceId);
}

function viewStoryDetails(storyId) {
    showNotification('View Story feature coming soon!', 'info');
    console.log('View Story:', storyId);
}

function deleteStory(storyId) {
    if (confirm('Are you sure you want to delete this success story?')) {
        showNotification('Delete Story feature coming soon! For now, use the API directly.', 'info');
        console.log('Delete Story:', storyId);
    }
}

// Make functions globally available
window.openCreateMentorModal = openCreateMentorModal;
window.openEditMentorModal = openEditMentorModal;
window.openCreateEventModal = openCreateEventModal;
window.openEditEventModal = openEditEventModal;
window.openCreateResourceModal = openCreateResourceModal;
window.openEditResourceModal = openEditResourceModal;
window.viewStoryDetails = viewStoryDetails;
window.deleteStory = deleteStory;

// ==================== BLOG TEMPLATE & PREVIEW FUNCTIONS ====================

// Template configurations
const blogTemplates = {
    default: {
        name: 'Default - Clean & Simple',
        description: 'Clean, minimalist design with focus on readability',
        preview: 'Simple white background, centered content, subtle shadows'
    },
    modern: {
        name: 'Modern - Bold & Colorful',
        description: 'Vibrant gradients and modern UI elements',
        preview: 'Colorful header, gradient accents, bold typography'
    },
    minimal: {
        name: 'Minimal - Typography Focused',
        description: 'Emphasis on beautiful typography and whitespace',
        preview: 'Large fonts, generous spacing, minimal distractions'
    },
    magazine: {
        name: 'Magazine - Rich Media',
        description: 'Perfect for image-heavy content',
        preview: 'Full-width images, caption support, multi-column layout'
    },
    tech: {
        name: 'Tech - Code Friendly',
        description: 'Optimized for technical blogs with code snippets',
        preview: 'Syntax highlighting, monospace fonts, dark theme option'
    },
    creative: {
        name: 'Creative - Artistic',
        description: 'Unique layouts with artistic flair',
        preview: 'Asymmetric layouts, custom animations, creative elements'
    }
};

const fontStyles = {
    default: {
        heading: 'Noto Serif, Georgia, serif',
        body: 'Noto Sans, Arial, sans-serif',
        code: 'Courier New, monospace'
    },
    modern: {
        heading: 'Outfit, Inter, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        code: 'Fira Code, monospace'
    },
    classic: {
        heading: 'Georgia, Times New Roman, serif',
        body: 'Arial, Helvetica, sans-serif',
        code: 'Courier New, monospace'
    },
    tech: {
        heading: 'Roboto Mono, monospace',
        body: 'Roboto, sans-serif',
        code: 'Fira Code, Consolas, monospace'
    },
    elegant: {
        heading: 'Playfair Display, Georgia, serif',
        body: 'Lato, sans-serif',
        code: 'Monaco, monospace'
    },
    bold: {
        heading: 'Montserrat, sans-serif',
        body: 'Montserrat, sans-serif',
        code: 'Source Code Pro, monospace'
    }
};

// Preview blog template
function previewBlogTemplate() {
    const template = document.getElementById('blogTemplate').value;
    const fontStyle = document.getElementById('fontStyle').value;

    const selectedTemplate = blogTemplates[template];
    const selectedFont = fontStyles[fontStyle];

    const previewHTML = `
        <div class="template-preview p-6">
            <h2 class="text-2xl font-bold mb-4" style="font-family: ${selectedFont.heading}">
                ${selectedTemplate.name}
            </h2>
            <p class="text-gray-600 mb-4" style="font-family: ${selectedFont.body}">
                ${selectedTemplate.description}
            </p>
            <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <p class="text-sm" style="font-family: ${selectedFont.body}">
                    <strong>Preview:</strong> ${selectedTemplate.preview}
                </p>
            </div>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Heading Font</p>
                    <p class="text-sm font-bold" style="font-family: ${selectedFont.heading}">Aa</p>
                </div>
                <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Body Font</p>
                    <p class="text-sm" style="font-family: ${selectedFont.body}">Aa</p>
                </div>
                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Code Font</p>
                    <p class="text-sm" style="font-family: ${selectedFont.code}">{'}'}</p>
                </div>
            </div>
        </div>
    `;

    // Show in notification or modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="text-xl font-bold">Template Preview</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            ${previewHTML}
        </div>
    `;
    document.body.appendChild(modal);
}

// Reset template to default
function resetTemplate() {
    document.getElementById('blogTemplate').value = 'default';
    document.getElementById('fontStyle').value = 'default';
    showNotification('Template reset to default', 'success');
}

// Preview full blog
function previewFullBlog() {
    const title = document.getElementById('title')?.value || 'Untitled Blog Post';
    const excerpt = document.getElementById('excerpt')?.value || 'No excerpt provided';
    const content = document.getElementById('content')?.value || 'No content yet';
    const category = document.getElementById('category')?.value || 'Uncategorized';
    const author = document.getElementById('author')?.value || 'Anonymous';
    const image = document.getElementById('image')?.value || '';
    const tags = document.getElementById('tags')?.value?.split(',').map(t => t.trim()).filter(t => t) || [];
    const template = document.getElementById('blogTemplate')?.value || 'default';
    const fontStyle = document.getElementById('fontStyle')?.value || 'default';

    const selectedFont = fontStyles[fontStyle];

    const previewHTML = `
        <div class="blog-preview" style="font-family: ${selectedFont.body}">
            <!-- Blog Header -->
            <div class="text-center mb-8">
                ${image ? `<img src="${image}" alt="${title}" class="w-full h-64 object-cover rounded-lg mb-6" onerror="this.style.display='none'">` : ''}
                <div class="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span class="px-3 py-1 bg-primary/10 text-primary rounded-full">${category}</span>
                    <span>•</span>
                    <span>By ${author}</span>
                    <span>•</span>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
                <h1 class="text-4xl font-bold mb-4" style="font-family: ${selectedFont.heading}">${title}</h1>
                <p class="text-xl text-gray-600 dark:text-gray-400">${excerpt}</p>
            </div>
            
            <!-- Blog Content -->
            <div class="prose dark:prose-invert max-w-none">
                <div style="font-family: ${selectedFont.body}; line-height: 1.8;">
                    ${content.split('\n').map(p => `<p class="mb-4">${p || '&nbsp;'}</p>`).join('')}
                </div>
            </div>
            
            <!-- Tags -->
            ${tags.length > 0 ? `
                <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-semibold mb-3">Tags:</h3>
                    <div class="flex flex-wrap gap-2">
                        ${tags.map(tag => `
                            <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">#${tag}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Template Info -->
            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Template:</strong> ${blogTemplates[template]?.name || template} | 
                    <strong>Font:</strong> ${fontStyle}
                </p>
            </div>
        </div>
    `;

    // Show full preview in modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full my-8">
            <div class="sticky top-0 bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl z-10">
                <h3 class="text-2xl font-bold flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">visibility</span>
                    Blog Preview
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="p-8 max-h-[70vh] overflow-y-auto">
                ${previewHTML}
            </div>
            <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                    Close
                </button>
                <button onclick="this.closest('.fixed').remove(); document.getElementById('createBlogForm').dispatchEvent(new Event('submit'));" 
                    class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                    Looks Good - Publish
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    });
}

// Add view blog functionality to existing blogs
function viewBlog(blogId) {
    fetch(`${API_BASE_URL}/blogs/${blogId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const blog = data.data;
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto';
                modal.innerHTML = `
                    <div class="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full my-8">
                        <div class="sticky top-0 bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl z-10">
                            <h3 class="text-2xl font-bold">${blog.title}</h3>
                            <button onclick="this.closest('.fixed').remove(); document.body.style.overflow=''" class="text-gray-500 hover:text-gray-700">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div class="p-8 prose dark:prose-invert max-w-none">
                            ${blog.featuredImage ? `<img src="${blog.featuredImage}" alt="${blog.title}" class="w-full rounded-lg mb-6">` : ''}
                            <div class="mb-4 flex gap-3 text-sm text-gray-600">
                                <span class="px-3 py-1 bg-primary/10 text-primary rounded-full">${blog.category || 'Uncategorized'}</span>
                                <span>By ${blog.authorName || 'Anonymous'}</span>
                                <span>•</span>
                                <span>${new Date(blog.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p class="text-xl text-gray-600 mb-6">${blog.excerpt || ''}</p>
                            <div>${blog.content || ''}</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                document.body.style.overflow = 'hidden';
            }
        })
        .catch(err => {
            console.error('Error fetching blog:', err);
            showNotification('Failed to load blog', 'error');
        });
}

// Make new functions globally available
window.previewBlogTemplate = previewBlogTemplate;
window.resetTemplate = resetTemplate;
window.previewFullBlog = previewFullBlog;
window.viewBlog = viewBlog;
