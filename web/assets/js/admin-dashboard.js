// Admin Dashboard JavaScript
// Note: API_BASE_URL is defined in blog-api.js (loaded before this script)
let currentEditBlogId = null;
let adminToken = null;
let adminData = null;

/**
 * Admin-aware fetch wrapper with automatic token refresh on 401.
 * Use this instead of raw fetch() for all admin API calls.
 */
async function adminFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (adminToken) options.headers['Authorization'] = `Bearer ${adminToken}`;

    let response = await fetch(url, options);

    if (response.status === 401) {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (data.success && data.access_token) {
                        // Save the new tokens
                        localStorage.setItem('accessToken', data.access_token);
                        if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
                        adminToken = data.access_token;

                        // Retry original request with new token
                        options.headers['Authorization'] = `Bearer ${adminToken}`;
                        response = await fetch(url, options);
                    }
                } else {
                    // Refresh failed — force re-login
                    console.warn('Token refresh failed, redirecting to login');
                    showError('Session expired. Please login again.');
                    setTimeout(() => { AuthGuard.logout(); }, 1500);
                }
            } catch (e) {
                console.error('Token refresh error:', e);
                showError('Session expired. Please login again.');
                setTimeout(() => { AuthGuard.logout(); }, 1500);
            }
        } else {
            showError('Session expired. Please login again.');
            setTimeout(() => { AuthGuard.logout(); }, 1500);
        }
    }

    return response;
}

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
        loadCommunityStats();
        loadRecentActivity(); // Load activity feed
        console.log('✅ All tabs loaded!');
    }, 500);

    setupEventListeners();
});

// Check Admin Authentication
function checkAdminAuth() {
    console.log('Checking admin authentication...');
    const user = AuthGuard.getCurrentUser();

    if (!user) {
        console.warn('AuthGuard: No user found, redirecting to login');
        AuthGuard.redirectToLogin();
        return;
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
        console.warn('User is not admin:', user.role);
        alert('Access Denied: Admin privileges required.');
        AuthGuard.clearAuth(); // Clear invalid user session
        window.location.href = 'admin-login.html';
        return;
    }

    // Save current admin details for role-based UI
    adminData = user;

    // Use accessToken for API calls instead of separate adminToken
    adminToken = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');

    // Update UI with user info
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = user.firstName
            ? `${user.firstName} ${user.lastName || ''}`
            : (user.email || 'Admin');
    }

    const settingsEmail = document.getElementById('settingsEmail');
    if (settingsEmail) settingsEmail.value = user.email || '';

    const lastLoginEl = document.getElementById('lastLogin');
    if (lastLoginEl) lastLoginEl.value = new Date().toLocaleString();
}

// Function to handle logout
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        AuthGuard.logout();
    }
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
        'settings': 'Settings',
        'applications': 'Loan Applications'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Admin Panel';

    // Load data if needed
    if (tabName === 'blogs') {
        loadBlogs();
    } else if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'community') {
        loadCommunityData('mentorship'); // Load mentorship by default
    } else if (tabName === 'applications') {
        loadApplications();
    }
}

// Load Loan Applications
async function loadApplications() {
    try {
        const searchTerm = document.getElementById('searchApplications')?.value || '';
        const filterStatus = document.getElementById('filterAppStatus')?.value || '';

        // Construct query params
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterStatus) params.append('status', filterStatus);
        params.append('limit', '50'); // Fetch more for admin view

        const response = await fetch(`${API_BASE_URL}/applications/admin/all?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayApplications(data.data || []);
            }
        } else if (response.status === 401) {
            showError('Session expired. Please login again.');
            redirectToLogin();
        } else {
            // Fallback for demo/testing if API fails or backend not fully ready
            console.warn('API fetch failed, checking for local demo data');
            displayApplications([]);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        showError('Failed to load applications');
    }
}

// Display Applications in Table
function displayApplications(apps) {
    const list = document.getElementById('applicationsList');

    if (!apps || apps.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    No applications found.
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = apps.map(app => `
        <tr>
            <td class="px-6 py-4">
                <span class="font-mono text-xs text-gray-500">${app.applicationNumber || app.id.substring(0, 8)}</span>
            </td>
            <td class="px-6 py-4">
                <div>
                    <p class="font-medium">${escapeHtml(app.firstName || '')} ${escapeHtml(app.lastName || '')}</p>
                    <p class="text-xs text-gray-500">${escapeHtml(app.email || 'N/A')}</p>
                </div>
            </td>
            <td class="px-6 py-4">
                <div>
                    <p class="font-medium">${escapeHtml(app.bank)}</p>
                    <p class="text-xs text-gray-500 capitalize">${app.loanType}</p>
                </div>
            </td>
            <td class="px-6 py-4 font-medium">₹${(app.amount || 0).toLocaleString()}</td>
            <td class="px-6 py-4">
                <span class="status-badge status-${getStatusColor(app.status)}">
                    ${escapeHtml(app.status)}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${new Date(app.date || app.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-2">
                    <button onclick="viewApplication('${app.id}')" title="View Details"
                        class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800">
                        visibility
                    </button>
                    ${app.status === 'pending' ? `
                    <button onclick="updateApplicationStatus('${app.id}', 'approved')" title="Approve"
                        class="material-symbols-outlined text-lg cursor-pointer text-green-600 hover:text-green-800">
                        check_circle
                    </button>
                    <button onclick="updateApplicationStatus('${app.id}', 'rejected')" title="Reject"
                        class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">
                        cancel
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'approved': return 'published'; // green
        case 'rejected': return 'draft';     // blue/grey usually, but using draft style
        case 'submitted': return 'pending';  // orange
        case 'pending': return 'pending';
        default: return 'draft';
    }
}

async function updateApplicationStatus(id, newStatus) {
    if (!confirm(`Are you sure you want to mark this application as ${newStatus}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/applications/admin/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showSuccess(`Application ${newStatus} successfully!`);
            loadApplications();
        } else {
            showError('Failed to update status');
        }
    } catch (e) {
        console.error(e);
        showError('Error updating status');
    }
}
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

        response = await fetch(`${API_BASE_URL}/blogs/admin/all?limit=1000`);
        if (response.ok) {
            const data = await response.json();
            const blogs = data.data || [];

            // If we have pagination info, use the total from there
            const totalCount = data.pagination ? data.pagination.total : blogs.length;

            const published = blogs.filter(b => b.isPublished).length;
            const draft = blogs.filter(b => !b.isPublished).length;
            const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);

            document.getElementById('totalBlogs').textContent = totalCount;
            document.getElementById('publishedBlogs').textContent = published;
            document.getElementById('draftBlogs').textContent = draft;
            document.getElementById('totalViews').textContent = totalViews.toLocaleString();

            console.log(`✅ Stats calculated: ${totalCount} total, ${published} published, ${draft} drafts`);
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
        const searchTerm = document.getElementById('searchBlogs')?.value?.trim() || '';
        const filterStatus = document.getElementById('filterStatus')?.value || '';
        const filterCategory = document.getElementById('filterCategory')?.value || '';

        const blogsList = document.getElementById('blogsList');
        if (blogsList) {
            blogsList.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500"><div class="flex justify-center"><div class="loading-spinner"></div></div></td></tr>`;
        }

        const response = await fetch(`${API_BASE_URL}/blogs/admin/all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                let blogs = data.data || [];

                // Update tab-level blog stats cards
                const allBlogs = blogs;
                const statTotal = document.getElementById('blogStatTotal');
                const statPublished = document.getElementById('blogStatPublished');
                const statDrafts = document.getElementById('blogStatDrafts');
                const statFeatured = document.getElementById('blogStatFeatured');
                const statViews = document.getElementById('blogStatViews');
                if (statTotal) statTotal.textContent = allBlogs.length;
                if (statPublished) statPublished.textContent = allBlogs.filter(b => b.isPublished).length;
                if (statDrafts) statDrafts.textContent = allBlogs.filter(b => !b.isPublished).length;
                if (statFeatured) statFeatured.textContent = allBlogs.filter(b => b.isFeatured).length;
                if (statViews) statViews.textContent = allBlogs.reduce((sum, b) => sum + (b.views || 0), 0).toLocaleString();

                // Filter by search term
                if (searchTerm) {
                    blogs = blogs.filter(blog =>
                        (blog.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (blog.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (blog.authorName || '').toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                // Filter by status
                if (filterStatus === 'published') {
                    blogs = blogs.filter(blog => blog.isPublished);
                } else if (filterStatus === 'draft') {
                    blogs = blogs.filter(blog => !blog.isPublished);
                }

                // Filter by category
                if (filterCategory) {
                    blogs = blogs.filter(blog =>
                        (blog.category || '').toLowerCase() === filterCategory.toLowerCase()
                    );
                }

                displayBlogs(blogs, allBlogs.length);
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
function displayBlogs(blogs, totalCount) {
    const blogsList = document.getElementById('blogsList');
    const countInfo = document.getElementById('blogsCountInfo');

    if (countInfo) {
        countInfo.textContent = blogs.length < (totalCount || blogs.length)
            ? `Showing ${blogs.length} of ${totalCount} blogs`
            : `${blogs.length} blog${blogs.length !== 1 ? 's' : ''} total`;
    }

    if (blogs.length === 0) {
        blogsList.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">article</span>
                    <p class="font-medium mb-1">No blogs found</p>
                    <p class="text-sm">Try adjusting your filters or <a href="create-blog-canva.html" class="text-primary hover:underline">create a new blog</a></p>
                </td>
            </tr>
        `;
        return;
    }

    blogsList.innerHTML = blogs.map(blog => `
        <tr class="transition-colors hover:bg-purple-50/30 dark:hover:bg-purple-900/10">
            <td class="px-4 py-4">
                <input type="checkbox" class="blog-checkbox" value="${blog.id}" />
            </td>
            <td class="px-6 py-4 max-w-xs">
                <div class="flex items-start gap-3">
                    ${blog.featuredImage ? `<img src="${escapeHtml(blog.featuredImage)}" class="w-10 h-10 rounded object-cover flex-shrink-0 mt-0.5" alt="thumb" onerror="this.style.display='none'">` : '<div class="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center"><span class="material-symbols-outlined text-sm text-gray-400">image</span></div>'}
                    <div class="min-w-0">
                        <p class="font-medium truncate">${escapeHtml(blog.title)}</p>
                        <p class="text-xs text-gray-400 truncate">${escapeHtml(blog.slug)}</p>
                        ${blog.isFeatured ? '<span class="inline-flex items-center gap-0.5 text-xs text-yellow-600 font-medium"><span class="material-symbols-outlined text-xs" style="font-size:12px">star</span>Featured</span>' : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm">${escapeHtml(blog.authorName || 'Unknown')}</td>
            <td class="px-6 py-4">
                ${blog.category ? `<span class="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">${escapeHtml(blog.category)}</span>` : '<span class="text-gray-400 text-xs">—</span>'}
            </td>
            <td class="px-6 py-4">
                <span class="status-badge status-${blog.isPublished ? 'published' : 'draft'}">
                    ${blog.isPublished ? 'Published' : 'Draft'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm">
                <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-gray-400">visibility</span>
                    ${(blog.views || 0).toLocaleString()}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${new Date(blog.updatedAt || blog.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <div class="flex justify-center gap-1.5 flex-wrap">
                    <button onclick="viewBlogDetails('${blog.id}')"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition-colors" title="View Details">
                        <span class="material-symbols-outlined text-sm">info</span>
                        Details
                    </button>
                    <button onclick="toggleBlogPublish('${blog.id}', ${blog.isPublished})"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${blog.isPublished ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'} rounded-lg border transition-colors" title="${blog.isPublished ? 'Unpublish' : 'Publish'}">
                        <span class="material-symbols-outlined text-sm">${blog.isPublished ? 'unpublished' : 'publish'}</span>
                        ${blog.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onclick="openEditModal('${blog.id}')"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors" title="Edit Blog">
                        <span class="material-symbols-outlined text-sm">edit</span>
                        Edit
                    </button>
                    <button onclick="deleteBlog('${blog.id}')"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors" title="Delete Blog">
                        <span class="material-symbols-outlined text-sm">delete</span>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// View Blog Details in a Modal (like viewUser)
async function viewBlogDetails(blogId) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/admin/all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch blogs');
        const data = await response.json();
        const blog = (data.data || []).find(b => b.id === blogId);
        if (!blog) throw new Error('Blog not found');

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div class="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-2xl">article</span>
                        <h3 class="text-xl font-bold">Blog Details</h3>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="material-symbols-outlined cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">close</button>
                </div>
                ${blog.featuredImage ? `<div class="w-full h-48 overflow-hidden"><img src="${escapeHtml(blog.featuredImage)}" class="w-full h-full object-cover" alt="Featured Image"></div>` : ''}
                <div class="p-6 space-y-4">
                    <div>
                        <h4 class="text-lg font-bold text-gray-900 dark:text-white">${escapeHtml(blog.title)}</h4>
                        <p class="text-sm text-gray-500 font-mono mt-1">/blog/${escapeHtml(blog.slug)}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <span class="status-badge status-${blog.isPublished ? 'published' : 'draft'}">${blog.isPublished ? 'Published' : 'Draft'}</span>
                        ${blog.isFeatured ? '<span class="status-badge" style="background:rgba(234,179,8,0.2);color:#ca8a04;">⭐ Featured</span>' : ''}
                        ${blog.category ? `<span class="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700">${escapeHtml(blog.category)}</span>` : ''}
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p class="text-xs text-gray-500 mb-1">Author</p>
                            <p class="font-medium">${escapeHtml(blog.authorName || '—')}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p class="text-xs text-gray-500 mb-1">Views</p>
                            <p class="font-medium">${(blog.views || 0).toLocaleString()}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p class="text-xs text-gray-500 mb-1">Read Time</p>
                            <p class="font-medium">${blog.readTime ? blog.readTime + ' min' : '—'}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p class="text-xs text-gray-500 mb-1">Created</p>
                            <p class="font-medium">${blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '—'}</p>
                        </div>
                    </div>
                    ${blog.excerpt ? `
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p class="text-xs text-gray-500 mb-1">Excerpt</p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(blog.excerpt)}</p>
                    </div>` : ''}
                    ${blog.tags && blog.tags.length ? `
                    <div>
                        <p class="text-xs text-gray-500 mb-2">Tags</p>
                        <div class="flex flex-wrap gap-1.5">${blog.tags.map(t => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">${escapeHtml(t)}</span>`).join('')}</div>
                    </div>` : ''}
                </div>
                <div class="px-6 pb-6 flex gap-2 justify-end">
                    <button onclick="this.closest('.fixed').remove(); openEditModal('${blog.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">edit</span>
                        Edit Blog
                    </button>
                    <a href="blog-article.html?slug=${encodeURIComponent(blog.slug)}" target="_blank" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">open_in_new</span>
                        View Live
                    </a>
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (e) {
        console.error(e);
        showError(e.message || 'Failed to load blog details');
    }
}

// Toggle blog published status quickly from the table
async function toggleBlogPublish(blogId, currentlyPublished) {
    const action = currentlyPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} this blog?`)) return;
    try {
        const resp = await adminFetch(`${API_BASE_URL}/blogs/admin/bulk-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blogIds: [blogId], isPublished: !currentlyPublished })
        });
        const data = await resp.json();
        if (resp.ok) {
            showSuccess(data.message || `Blog ${action}ed successfully!`);
            loadBlogs();
        } else {
            showError(data.message || `Failed to ${action} blog`);
        }
    } catch (e) {
        console.error(e);
        showError(`Error: ${e.message}`);
    }
}

// Cache for client-side user filtering
let _allUsersCache = [];

// Load Users
async function loadUsers() {
    try {
        const usersList = document.getElementById('usersList');
        if (usersList) {
            usersList.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex justify-center"><div class="loading-spinner"></div></div>
                    </td>
                </tr>
            `;
        }

        const response = await adminFetch(`${API_BASE_URL}/users/admin/list`);
        if (!response.ok) {
            if (response.status === 401) {
                showError('Session expired. Redirecting to login...');
                redirectToLogin();
                return;
            }
            throw new Error('Failed to load users');
        }

        const result = await response.json();
        const users = result.data || [];

        // Cache for client-side filtering
        _allUsersCache = users;

        // Populate stat cards
        const statTotal = document.getElementById('userStatTotal');
        const statAdmins = document.getElementById('userStatAdmins');
        const statRegular = document.getElementById('userStatRegular');
        if (statTotal) statTotal.textContent = users.length;
        if (statAdmins) statAdmins.textContent = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
        if (statRegular) statRegular.textContent = users.filter(u => u.role !== 'admin' && u.role !== 'super_admin').length;

        renderUsersTable(users);

    } catch (error) {
        console.error('Error loading users:', error);
        const usersList = document.getElementById('usersList');
        if (usersList) usersList.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500">Failed to load users.</td>
            </tr>
        `;
    }
}

// Client-side user search/filter (no extra network call)
function filterUsersTable() {
    const searchTerm = (document.getElementById('searchUsers')?.value || '').trim().toLowerCase();
    const roleFilter = document.getElementById('filterUserRole')?.value || '';

    let filtered = _allUsersCache;

    if (searchTerm) {
        filtered = filtered.filter(u =>
            (`${u.firstName || ''} ${u.lastName || ''}`).toLowerCase().includes(searchTerm) ||
            (u.email || '').toLowerCase().includes(searchTerm)
        );
    }
    if (roleFilter) {
        filtered = filtered.filter(u => (u.role || 'user') === roleFilter);
    }

    renderUsersTable(filtered, _allUsersCache.length);
}

// Render user rows — separated so both loadUsers and filterUsersTable can call it
function renderUsersTable(users, totalCount) {
    const usersList = document.getElementById('usersList');
    const countInfo = document.getElementById('usersCountInfo');

    if (countInfo) {
        countInfo.textContent = users.length < (totalCount || users.length)
            ? `Showing ${users.length} of ${totalCount} users`
            : `${users.length} user${users.length !== 1 ? 's' : ''} total`;
    }

    if (!usersList) return;

    if (users.length === 0) {
        usersList.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">people</span>
                    <p class="font-medium mb-1">No users found</p>
                    <p class="text-sm">Try adjusting your search or filters</p>
                </td>
            </tr>
        `;
        return;
    }

    const isSuper = adminData?.role === 'super_admin';

    const roleColorMap = {
        'super_admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        'admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'user': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    };

    usersList.innerHTML = users.map(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
        const initials = [u.firstName, u.lastName].filter(Boolean).map(n => n[0]).join('').toUpperCase() || '?';
        const roleColor = roleColorMap[u.role] || roleColorMap['user'];
        const roleLabel = u.role === 'super_admin' ? 'Super Admin' : (u.role || 'user');

        return `
        <tr class="transition-colors hover:bg-purple-50/30 dark:hover:bg-purple-900/10">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm
                        ${u.role === 'super_admin' ? 'bg-red-100 text-red-700' : u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                        ${initials}
                    </div>
                    <div>
                        <p class="font-medium leading-tight">${escapeHtml(fullName)}</p>
                        <p class="text-xs text-gray-400 font-mono">${escapeHtml(u.id || '')}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm">${escapeHtml(u.email || '')}</td>
            <td class="px-6 py-4">
                <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${roleColor}">${escapeHtml(roleLabel)}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
            <td class="px-6 py-4">
                <div class="flex justify-center gap-1.5">
                    <button onclick="viewUser('${escapeHtml(u.email)}')"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition-colors" title="View User">
                        <span class="material-symbols-outlined text-sm">person_search</span>
                        View
                    </button>
                    ${isSuper ? (u.role !== 'admin' && u.role !== 'super_admin' ? `
                    <button onclick="changeUserRole('${escapeHtml(u.email)}','admin')"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors" title="Make Admin">
                        <span class="material-symbols-outlined text-sm">admin_panel_settings</span>
                        Make Admin
                    </button>
                    ` : u.role === 'admin' ? `
                    <button onclick="changeUserRole('${escapeHtml(u.email)}','user')"
                        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 transition-colors" title="Revoke Admin">
                        <span class="material-symbols-outlined text-sm">remove_moderator</span>
                        Revoke
                    </button>
                    ` : '') : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}


// Toggle select-all for blogs
function toggleSelectAllBlogs(cb) {
    document.querySelectorAll('.blog-checkbox').forEach(ch => ch.checked = cb.checked);
}

function getSelectedBlogIds() {
    return Array.from(document.querySelectorAll('.blog-checkbox:checked')).map(ch => ch.value);
}

async function bulkUpdateStatusSelected(isPublished) {
    const ids = getSelectedBlogIds();
    if (!ids.length) return showError('No blogs selected');
    if (!confirm(`Are you sure you want to ${isPublished ? 'publish' : 'unpublish'} ${ids.length} blog(s)?`)) return;

    try {
        const resp = await adminFetch(`${API_BASE_URL}/blogs/admin/bulk-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blogIds: ids, isPublished })
        });
        const data = await resp.json();
        if (resp.ok) {
            showSuccess(data.message || 'Updated status');
            loadBlogs();
        } else {
            showError(data.message || 'Failed to update status');
        }
    } catch (e) {
        console.error(e);
        showError('Error updating status');
    }
}

async function bulkDeleteSelected() {
    const ids = getSelectedBlogIds();
    if (!ids.length) return showError('No blogs selected');
    if (!confirm(`Delete ${ids.length} selected blog(s)? This cannot be undone.`)) return;

    try {
        const resp = await adminFetch(`${API_BASE_URL}/blogs/admin/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blogIds: ids })
        });
        const data = await resp.json();
        if (resp.ok) {
            showSuccess(data.message || 'Deleted selected blogs');
            loadBlogs();
        } else {
            showError(data.message || 'Failed to delete blogs');
        }
    } catch (e) {
        console.error(e);
        showError('Error deleting blogs');
    }
}

// View user details (modal)
async function viewUser(email) {
    try {
        const response = await adminFetch(`${API_BASE_URL}/users/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Failed to load user');
        const res = await response.json();
        if (!res.success) throw new Error(res.message || 'User not found');

        const u = res.user;
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold">User details</h3>
                    <button onclick="this.closest('.fixed').remove()" class="material-symbols-outlined cursor-pointer">close</button>
                </div>
                <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Name:</strong> ${escapeHtml((u.firstName || '') + ' ' + (u.lastName || ''))}</p>
                    <p><strong>Email:</strong> ${escapeHtml(u.email || '')}</p>
                    <p><strong>Role:</strong> ${escapeHtml(u.role || 'user')}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(u.phoneNumber || u.mobile || 'N/A')}</p>
                    <p><strong>DOB:</strong> ${escapeHtml(u.dateOfBirth || 'N/A')}</p>
                    <p><strong>Joined:</strong> ${u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div class="mt-6 flex justify-end gap-2">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-200 rounded">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        console.error(e);
        showError(e.message || 'Failed to load user details');
    }
}

// Change user role (super admin only)
async function changeUserRole(email, role) {
    if (!confirm(`Are you sure you want to set role to '${role}' for ${email}?`)) return;
    try {
        const resp = await adminFetch(`${API_BASE_URL}/users/make-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role })
        });
        const data = await resp.json();
        if (resp.ok) {
            showSuccess(data.message || 'Role updated');
            loadUsers();
        } else {
            showError(data.message || 'Failed to update role');
        }
    } catch (err) {
        console.error(err);
        showError('Error updating role');
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
        const response = await fetch(`${API_BASE_URL}/blogs/admin/${blogId}`, {
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
            case 'forum':
                await loadForumPosts();
                break;
        }
    } catch (error) {
        console.error('Error loading community data:', error);
    }
}

// Load Community Stats (Overall)
async function loadCommunityStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/community/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const stats = result.data.data || result.data; // Handle structure
                const setSafe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

                setSafe('totalMentors', stats.mentors || 0);
                setSafe('totalEvents', stats.events || 0);
                setSafe('totalStories', stats.stories || 0);
                setSafe('totalResources', stats.resources || 0);
                setSafe('totalForumPosts', stats.forumPosts || 0);
            }
        }
    } catch (error) {
        console.error('Error loading community stats:', error);
    }
}

// Load Forum Posts
async function loadForumPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/community/forum?limit=50`, { // Fetch more for admin view
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const posts = data.data || [];

            // Update stats if element exists
            const totalEl = document.getElementById('totalForumPosts');
            if (totalEl) totalEl.textContent = data.pagination?.total || posts.length;

            const forumList = document.getElementById('forumList');
            if (posts.length === 0) {
                forumList.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                            No discussions found.
                        </td>
                    </tr>
                `;
            } else {
                forumList.innerHTML = posts.map(post => `
                    <tr>
                        <td class="px-6 py-4">
                            <div class="max-w-xs">
                                <p class="font-medium truncate" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</p>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                ${escapeHtml(post.category)}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm">
                                <p class="font-medium">${escapeHtml((post.author?.firstName || '') + ' ' + (post.author?.lastName || ''))}</p>
                                <p class="text-xs text-gray-500">${escapeHtml(post.author?.role || 'user')}</p>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex gap-3 text-sm text-gray-600">
                                <span class="flex items-center gap-1" title="Likes">
                                    <span class="material-symbols-outlined text-xs">thumb_up</span> ${post.likes || 0}
                                </span>
                                <span class="flex items-center gap-1" title="Comments">
                                    <span class="material-symbols-outlined text-xs">chat_bubble</span> ${post.commentCount || 0}
                                </span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">${new Date(post.createdAt).toLocaleDateString()}</td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center gap-2">
                                <a href="engage.html?post=${post.id}" target="_blank" 
                                    class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800" title="View Discussion">
                                    visibility
                                </a>
                                <button onclick="deleteForumPost('${post.id}')" title="Delete" 
                                    class="material-symbols-outlined text-lg cursor-pointer text-red-600 hover:text-red-800">
                                    delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading forum posts:', error);
        const forumList = document.getElementById('forumList');
        if (forumList) {
            forumList.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        Error loading discussions. Please try again.
                    </td>
                </tr>
            `;
        }
    }
}

// Delete Forum Post
async function deleteForumPost(postId) {
    if (!confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await adminFetch(`${API_BASE_URL}/community/forum/${postId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Discussion deleted successfully!');
            loadForumPosts();
        } else {
            showError(result.message || 'Failed to delete discussion');
        }
    } catch (error) {
        console.error('Error deleting discussion:', error);
        showError('Error deleting discussion');
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
                                <button onclick="openEditStoryModal('${story.id}')" title="Edit" class="material-symbols-outlined text-lg cursor-pointer text-blue-600 hover:text-blue-800">edit</button>
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
        window.location.href = 'admin-login.html';
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
        window.location.href = 'admin-login.html?redirect=admin-dashboard.html';
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

// ==================== COMMUNITY VIEW FUNCTIONS ====================

async function viewStoryDetails(storyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/community/stories/${storyId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await response.json();
        if (data.success) {
            const story = data.data;
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="text-xl font-bold">Success Story Details</h3>
                         <button onclick="this.closest('.fixed').remove()" class="material-symbols-outlined cursor-pointer hover:text-red-500">close</button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div>
                            <h4 class="font-bold text-lg">${escapeHtml(story.name)}</h4>
                            <p class="text-gray-500">${escapeHtml(story.university)} • ${escapeHtml(story.degree)}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div><span class="font-semibold">Country:</span> ${escapeHtml(story.country)}</div>
                            <div><span class="font-semibold">Bank:</span> ${escapeHtml(story.bank)}</div>
                            <div><span class="font-semibold">Loan Amount:</span> ${escapeHtml(story.loanAmount)}</div>
                            <div><span class="font-semibold">Email:</span> ${escapeHtml(story.email)}</div>
                        </div>
                        <div>
                            <h5 class="font-semibold mb-2">Story</h5>
                            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded">${escapeHtml(story.story)}</p>
                        </div>
                        <div>
                            <h5 class="font-semibold mb-2">Tips</h5>
                            <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded">${escapeHtml(story.tips)}</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error('Error viewing story:', error);
        showError('Failed to load story details');
    }
}

// Make functions globally available
window.viewStoryDetails = viewStoryDetails;
// Note: openCreate..., openEdit..., deleteStory are now handled by admin-community-crud.js

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

// View Application Details Modal
async function viewApplication(appId) {
    const modal = document.getElementById('applicationDetailsModal');
    const content = document.getElementById('applicationModalContent');

    if (!modal) return;

    // Show modal with loading state
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    content.innerHTML = `
        <div class="text-center py-12">
            <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p class="mt-4 text-gray-500">Loading details...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/applications/${appId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server Error:', errorData);
            throw new Error(errorData.message || 'Failed to load details');
        }

        const result = await response.json();
        const app = result.data;

        content.innerHTML = `
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 ${getStatusBg(app.status)} rounded-2xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl ${getStatusColor(app.status)}">
                            ${getLoanIcon(app.loanType || app.type)}
                        </span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">${formatLoanType(app.loanType || app.type)}</h2>
                        <p class="text-gray-500 dark:text-gray-400">Application #${app.applicationNumber || app.id.substring(0, 8)}</p>
                    </div>
                </div>
                
                <div class="flex flex-col items-end gap-2">
                    <span class="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${getStatusClass(app.status)}">
                        ${app.status?.replace('_', ' ')}
                    </span>
                    <p class="text-sm text-gray-500">Applied on ${new Date(app.date || app.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <!-- Primary Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <!-- Applicant -->
                <div class="glass-card p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p class="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">person</span> Applicant
                    </p>
                    <p class="font-bold text-lg">${app.user?.firstName || app.firstName} ${app.user?.lastName || app.lastName || ''}</p>
                    <p class="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <span class="material-symbols-outlined text-xs">email</span> ${app.user?.email || app.email}
                    </p>
                    <p class="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <span class="material-symbols-outlined text-xs">call</span> ${app.user?.phoneNumber || app.phone || 'N/A'}
                    </p>
                     ${app.dateOfBirth ? `<p class="text-sm text-gray-500 mt-1">DOB: ${new Date(app.dateOfBirth).toLocaleDateString()}</p>` : ''}
                </div>
                
                <!-- Financial -->
                <div class="glass-card p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                     <p class="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">payments</span> Finance
                    </p>
                    <p class="font-bold text-lg text-primary">₹${(app.amount || 0).toLocaleString('en-IN')}</p>
                    <p class="text-sm text-gray-500 mt-1">Bank: <span class="font-medium text-gray-700 dark:text-gray-300">${app.bank}</span></p>
                    ${app.tenure ? `<p class="text-sm text-gray-500 mt-1">Tenure: ${app.tenure} Months</p>` : ''}
                    ${app.annualIncome ? `<p class="text-sm text-gray-500 mt-1">Annual Income: ₹${app.annualIncome.toLocaleString('en-IN')}</p>` : ''}
                </div>

                <!-- Education/Loan Specific -->
                <div class="glass-card p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                     <p class="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">school</span> Education
                    </p>
                    <p class="font-bold text-sm truncate" title="${app.universityName || app.university}">${app.universityName || app.university || 'N/A'}</p>
                    <p class="text-sm text-gray-500 mt-1">Course: ${app.course || app.courseName || 'N/A'}</p>
                    ${app.courseStartDate ? `<p class="text-sm text-gray-500 mt-1">Starts: ${new Date(app.courseStartDate).toLocaleDateString()}</p>` : ''}
                </div>
            </div>

            <!-- Detailed Info Sections (Collapsible/Tabs could be better, but stacking for now) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Address & Employment -->
                <div class="bg-gray-50 dark:bg-gray-800/30 p-5 rounded-xl">
                    <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">location_on</span> Address & Employment
                    </h4>
                    <div class="space-y-2 text-sm">
                        <p><span class="text-gray-500">Address:</span> <span class="text-gray-800 dark:text-gray-200">${app.address || 'N/A'}</span></p>
                        <p><span class="text-gray-500">City/State:</span> <span class="text-gray-800 dark:text-gray-200">${app.city || '-'}, ${app.state || '-'}</span></p>
                        <div class="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                        <p><span class="text-gray-500">Employment:</span> <span class="text-gray-800 dark:text-gray-200 capitalize">${app.employmentType || 'N/A'}</span></p>
                        <p><span class="text-gray-500">Employer:</span> <span class="text-gray-800 dark:text-gray-200">${app.employerName || 'N/A'}</span></p>
                        <p><span class="text-gray-500">Job Title:</span> <span class="text-gray-800 dark:text-gray-200">${app.jobTitle || 'N/A'}</span></p>
                    </div>
                </div>

                <!-- Additional Details (Co-Applicant / Collateral) -->
                <div class="bg-gray-50 dark:bg-gray-800/30 p-5 rounded-xl">
                    <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">group</span> Co-Applicant & Collateral
                    </h4>
                     <div class="space-y-2 text-sm">
                        ${app.hasCoApplicant ? `
                            <p><span class="text-gray-500">Co-Applicant:</span> <span class="font-medium">${app.coApplicantName}</span> (${app.coApplicantRelation})</p>
                             <p><span class="text-gray-500">Phone/Email:</span> ${app.coApplicantPhone || '-'} / ${app.coApplicantEmail || '-'}</p>
                             <p><span class="text-gray-500">Income:</span> ₹${(app.coApplicantIncome || 0).toLocaleString('en-IN')}</p>
                        ` : `<p class="text-gray-400 italic">No Co-Applicant details provided.</p>`}
                        
                        <div class="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                        
                        ${app.hasCollateral ? `
                             <p><span class="text-gray-500">Collateral:</span> <span class="font-medium capitalize">${app.collateralType}</span></p>
                             <p><span class="text-gray-500">Value:</span> ₹${(app.collateralValue || 0).toLocaleString('en-IN')}</p>
                        ` : `<p class="text-gray-400 italic">No Collateral details provided.</p>`}
                    </div>
                </div>
            </div>
            
            <!-- Documents Section -->
            <div class="mb-8">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">folder_open</span>
                    Documents
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${renderDocumentsList(app.documents, app.id)}
                </div>
            </div>

            ${app.purpose ? `
            <div class="mb-8 bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h4 class="font-bold mb-2 text-sm text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">format_quote</span> Statement of Purpose
                </h4>
                <p class="text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap leading-relaxed">"${app.purpose}"</p>
            </div>
            ` : ''}

            <!-- Action Footer -->
            <div class="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 -mx-8 -mb-8 p-8 mt-4">
                <button onclick="closeApplicationModal()" 
                    class="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors">
                    Close
                </button>

                ${['pending', 'submitted', 'under_review'].includes(app.status) ? `
                <button onclick="updateApplicationStatus('${app.id}', 'rejected'); closeApplicationModal()" 
                    class="px-6 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-lg">cancel</span> Reject
                </button>
                <button onclick="updateApplicationStatus('${app.id}', 'approved'); closeApplicationModal()" 
                    class="px-6 py-2 bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-lg">check_circle</span> Approve Loan
                </button>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error fetching application details:', error);
        console.log('Token status:', adminToken ? 'Present' : 'Missing', adminToken);

        let errorDetails = error.message || 'Unknown error';
        if (error.cause) {
            try {
                errorDetails += ` (${JSON.stringify(error.cause)})`;
            } catch (e) {
                // ignore circular structure errors
            }
        }

        content.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <span class="material-symbols-outlined text-4xl mb-4">error</span>
                <h3 class="text-lg font-bold">Failed to load details</h3>
                <p class="font-medium mt-2">Error: ${escapeHtml(error.name || 'Error')}</p>
                <div class="mt-4 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded text-left overflow-auto max-h-40 max-w-lg mx-auto border border-red-100 dark:border-red-900/50">
                    <code class="break-words whitespace-pre-wrap">${escapeHtml(errorDetails)}</code>
                </div>
                 <div class="mt-2 text-xs text-gray-400">
                    Token: ${adminToken ? 'Present' : 'Missing'}
                </div>
                <button onclick="closeApplicationModal()" class="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                    Close
                </button>
            </div>
        `;
    }
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function renderDocumentsList(documents, applicationId) {
    if (!documents || documents.length === 0) {
        return '<div class="col-span-full text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl">No documents uploaded yet.</div>';
    }

    return documents.map(doc => {
        // Handle Windows backslashes
        const normalizedPath = doc.filePath ? doc.filePath.replace(/\\/g, '/') : '';
        // Construct detailed view URL
        let viewUrl = '';
        if (applicationId && doc.id) {
            viewUrl = `${API_BASE_URL}/applications/admin/${applicationId}/documents/${doc.id}/view`;
        } else if (normalizedPath) {
            viewUrl = `${API_BASE_URL}/${normalizedPath}`;
        }
        const ext = normalizedPath.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

        return `
        <div class="flex items-start p-4 border rounded-xl ${doc.status === 'rejected' ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}">
            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4 shrink-0">
                ${isImage && viewUrl ? `
                    <img src="${viewUrl}" alt="${formatDocType(doc.docType)}" class="w-10 h-10 object-cover rounded" onerror="this.outerHTML='<span class=\\'material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300\\'>description</span>'" />
                ` : `
                    <span class="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300">description</span>
                `}
            </div>
            <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="font-bold text-gray-800 dark:text-gray-200">${formatDocType(doc.docType)}</h4>
                    ${getAdminDocStatusBadge(doc)}
                </div>
                ${doc.docName ? `<p class="text-xs text-gray-500 mb-1">${escapeHtml(doc.docName)}</p>` : ''}
                ${doc.fileSize ? `<p class="text-xs text-gray-400">${formatFileSize(doc.fileSize)}</p>` : ''}
                
                ${doc.status === 'rejected' && doc.rejectionReason ? `
                    <p class="text-sm text-red-600 dark:text-red-400 mt-1 mb-2">
                        <span class="font-bold">Reason:</span> ${doc.rejectionReason}
                    </p>
                    ${doc.aiExplanation ? `
                    <div class="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700">
                        <span class="font-bold text-primary">AI Explanation sent to user:</span> "${doc.aiExplanation}"
                    </div>
                    ` : ''}
                ` : ''}

                ${doc.status === 'verified' && doc.digilockerTxId ? `
                     <p class="text-xs text-green-600 dark:text-green-400 mt-1 mb-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">verified_user</span> 
                        Digilocker Verified (Tx: ${doc.digilockerTxId.substring(0, 8)}...)
                    </p>
                ` : ''}
                
                <div class="mt-3 flex gap-2">
                    ${viewUrl ? `
                        <button onclick="openAdminDocPreview('${viewUrl}', '${formatDocType(doc.docType)}', '${ext}')" 
                           class="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">visibility</span> View
                        </button>
                        <a href="${viewUrl}" download 
                           class="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded text-sm font-medium transition-colors flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">download</span> Download
                        </a>
                    ` : '<span class="text-xs text-gray-400 italic">File not uploaded yet</span>'}
                </div>
            </div>
        </div>
    `}).join('');
}

// Admin document preview modal
function openAdminDocPreview(url, docTypeName, ext) {
    const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
    const isPdf = ext === 'pdf';

    // Remove any existing modal
    const existingModal = document.getElementById('admin-doc-preview-modal');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'admin-doc-preview-modal';
    overlay.className = 'fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm';
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary text-2xl">description</span>
                    <h3 class="text-lg font-bold">${docTypeName}</h3>
                </div>
                <div class="flex items-center gap-2">
                    <a href="${url}" download class="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">download</span> Download
                    </a>
                    <a href="${url}" target="_blank" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">open_in_new</span> Open
                    </a>
                    <button onclick="document.getElementById('admin-doc-preview-modal').remove()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800 min-h-[400px]">
                ${isImage ? `
                    <img src="${url}" alt="${docTypeName}" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" 
                         onerror="this.parentElement.innerHTML='<div class=\\'text-center text-gray-500 py-12\\'><span class=\\'material-symbols-outlined text-6xl mb-4 block\\'>broken_image</span><p>Unable to load preview</p><a href=\\'${url}\\' target=\\'_blank\\' class=\\'text-primary underline mt-2 block\\'>Try opening directly</a></div>'" />
                ` : isPdf ? `
                    <iframe src="${url}" class="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700" 
                            frameborder="0"></iframe>
                ` : `
                    <div class="text-center text-gray-500 py-12">
                        <span class="material-symbols-outlined text-6xl mb-4 block">description</span>
                        <p class="text-lg font-medium mb-2">Document Preview</p>
                        <p class="text-sm mb-4">This file type cannot be previewed directly in the browser.</p>
                        <a href="${url}" target="_blank" class="px-4 py-2 bg-primary text-white rounded-lg inline-flex items-center gap-2 hover:bg-primary/90">
                            <span class="material-symbols-outlined text-sm">open_in_new</span> Open in New Tab
                        </a>
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Format file size helper
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.openAdminDocPreview = openAdminDocPreview;

function getAdminDocStatusBadge(doc) {
    if (doc.status === 'verified') {
        return `<span class="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase">Verified</span>`;
    } else if (doc.status === 'rejected') {
        return `<span class="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold uppercase">Rejected</span>`;
    } else if (doc.filePath) {
        return `<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold uppercase">Pending</span>`;
    } else {
        return `<span class="px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full text-xs font-bold uppercase">Missing</span>`;
    }
}

// Format helpers re-declared here just in case (or rely on existing ones if in scope)
function formatDocType(type) {
    if (!type) return 'Document';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
function formatLoanType(type) {
    const types = { education: 'Education Loan', home: 'Home Loan', personal: 'Personal Loan', business: 'Business Loan', vehicle: 'Vehicle Loan' };
    return types[type] || type || 'Loan Application';
}
function getLoanIcon(type) {
    const icons = { education: 'school', home: 'home', personal: 'person', business: 'business', vehicle: 'directions_car' };
    return icons[type] || 'account_balance';
}

// Helper functions for status styling
function getStatusBg(status) {
    status = (status || '').toLowerCase();
    if (status === 'approved' || status === 'verified') return 'bg-green-100 dark:bg-green-900/30';
    if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30';
    if (status === 'submitted' || status === 'processing' || status === 'under_review') return 'bg-blue-100 dark:bg-blue-900/30';
    return 'bg-gray-100 dark:bg-gray-800'; // pending/draft
}

function getStatusColor(status) {
    status = (status || '').toLowerCase();
    if (status === 'approved' || status === 'verified') return 'text-green-600 dark:text-green-400';
    if (status === 'rejected' || status === 'cancelled') return 'text-red-600 dark:text-red-400';
    if (status === 'submitted' || status === 'processing' || status === 'under_review') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
}

function getStatusClass(status) {
    status = (status || '').toLowerCase();
    if (status === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    if (status === 'submitted') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    if (status === 'processing' || status === 'under_review') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

// Using window assignment to ensure global availability
window.viewApplication = viewApplication;
window.closeApplicationModal = closeApplicationModal;

// Load Recent Activity
async function loadRecentActivity() {
    try {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-500">
                <div class="loading-spinner mb-2"></div>
                <p>Loading activity...</p>
            </div>
        `;

        const response = await fetch(`${API_BASE_URL}/audit/activity?limit=20`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                renderActivityList(result.data);
            } else {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-10 text-gray-500">
                        <span class="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
                        <p>No recent activity found.</p>
                    </div>
                `;
            }
        } else {
            console.error('Failed to load activity:', response.status);
            container.innerHTML = `
                <div class="text-center py-10 text-red-500">
                    <p>Failed to load activity feed.</p>
                    <button onclick="loadRecentActivity()" class="mt-2 text-sm underline">Try Again</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        const container = document.getElementById('recentActivityList');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-10 text-red-500">
                    <p>Error loading activity.</p>
                </div>
            `;
        }
    }
}

function renderActivityList(activities) {
    const container = document.getElementById('recentActivityList');
    container.innerHTML = activities.map(item => {
        let icon = 'info';
        let colorClass = 'bg-gray-100 text-gray-600';
        let bgClass = 'hover:bg-gray-50 dark:hover:bg-gray-800';

        switch (item.type) {
            case 'application':
                icon = 'description';
                colorClass = 'bg-blue-100 text-blue-600';
                break;
            case 'blog':
                icon = 'article';
                colorClass = 'bg-purple-100 text-purple-600';
                break;
            case 'forum':
                icon = 'forum';
                colorClass = 'bg-green-100 text-green-600';
                break;
            case 'user':
                icon = 'person_add';
                colorClass = 'bg-yellow-100 text-yellow-600';
                break;
            case 'mentor':
                icon = 'school';
                colorClass = 'bg-indigo-100 text-indigo-600';
                break;
        }

        const date = new Date(item.date).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Ensure description is safe string
        const description = (item.description || 'No description').toString();
        const title = (item.title || 'Untitled').toString();

        return `
            <div class="flex items-start gap-4 p-3 rounded-lg ${bgClass} transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 animate-fade-in">
                <div class="p-2 rounded-full ${colorClass} shrink-0 mt-1">
                    <span class="material-symbols-outlined text-xl">${icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <p class="font-medium text-sm truncate pr-2" title="${escapeHtml(title)}">${escapeHtml(title)}</p>
                        <span class="text-xs text-gray-500 whitespace-nowrap">${date}</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">${escapeHtml(description)}</p>
                    <div class="flex items-center justify-between">
                         <span class="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            ${item.type}
                        </span>
                        <a href="${item.link}" class="group text-xs text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
                            View Details <span class="material-symbols-outlined text-[10px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
