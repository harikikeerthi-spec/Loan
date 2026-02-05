// Admin Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3000';
let currentEditBlogId = null;
let adminToken = null;
let adminData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadDashboardStats();
    setupEventListeners();
});

// Check Admin Authentication
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const email = localStorage.getItem('userEmail');

    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html?redirect=admin-dashboard.html';
        return;
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
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Admin Panel';

    // Load data if needed
    if (tabName === 'blogs') {
        loadBlogs();
    } else if (tabName === 'users') {
        loadUsers();
    }
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/admin/stats`, {
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
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
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
