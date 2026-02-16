// Blog API Service
// Base URL for API calls - change this for production
const API_BASE_URL = 'http://localhost:3000';

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create blog card HTML
 */
function createBlogCard(blog, index) {
    const delayClass = `animate-delay-${(index % 6) + 1}`;
    const defaultImage = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80';
    const defaultAuthorImage = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80';

    return `
        <a href="blog-article.html?slug=${blog.slug}"
            class="blog-card glass-card rounded-2xl overflow-hidden shadow-lg opacity-0 animate-fade-in-up ${delayClass}">
            <div class="relative h-56 overflow-hidden">
                <img src="${blog.featuredImage || defaultImage}"
                    alt="${blog.title}" class="w-full h-full object-cover" />
                <div class="absolute top-4 left-4">
                    <span
                        class="px-3 py-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-primary text-[9px] font-bold uppercase tracking-wider rounded-full">
                        ${blog.category}
                    </span>
                </div>
            </div>
            <div class="p-6">
                <h3
                    class="text-xl font-display font-bold text-gray-900 dark:text-white mb-3 leading-snug hover:text-primary transition-colors">
                    ${blog.title}
                </h3>
                <p class="text-gray-500 dark:text-gray-400 font-sans text-sm leading-relaxed mb-4 line-clamp-2">
                    ${blog.excerpt}
                </p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <img src="${blog.authorImage || defaultAuthorImage}"
                            alt="${blog.authorName}" class="w-8 h-8 rounded-full object-cover" />
                        <span class="text-xs font-bold text-gray-600 dark:text-gray-400">${blog.authorName}</span>
                    </div>
                    <span class="text-xs text-gray-400">${blog.readTime} min read</span>
                </div>
                ${blog.tags && blog.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2 mt-4">
                        ${blog.tags.slice(0, 3).map(tag => `
                            <span class="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">#${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </a>
    `;
}

/**
 * Create featured blog HTML
 */
function createFeaturedBlog(blog) {
    const defaultImage = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80';
    const defaultAuthorImage = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80';

    return `
        <a href="blog-article.html?slug=${blog.slug}" class="block group">
            <div
                class="glass-card rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                <div class="grid md:grid-cols-2 gap-0">
                    <div class="relative h-72 md:h-[400px] overflow-hidden">
                        <img src="${blog.featuredImage || defaultImage}"
                            alt="${blog.title}"
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div class="absolute top-6 left-6">
                            <span
                                class="px-4 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Featured
                            </span>
                        </div>
                    </div>
                    <div class="p-8 md:p-12 flex flex-col justify-center">
                        <span class="text-primary font-bold text-[11px] tracking-[0.2em] uppercase mb-3">${blog.category}</span>
                        <h2
                            class="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-primary transition-colors">
                            ${blog.title}
                        </h2>
                        <p class="text-gray-500 dark:text-gray-400 font-sans leading-relaxed mb-6">
                            ${blog.excerpt}
                        </p>
                        <div class="flex items-center gap-4">
                            <img src="${blog.authorImage || defaultAuthorImage}"
                                alt="${blog.authorName}"
                                class="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
                            <div>
                                <p class="font-bold text-gray-900 dark:text-white text-sm">${blog.authorName}</p>
                                <p class="text-gray-400 text-xs">${formatDate(blog.publishedAt)} · ${blog.readTime} min read</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    `;
}

/**
 * Fetch all blogs from API and combine with admin blogs
 */
async function fetchBlogs(options = {}) {
    try {
        const params = new URLSearchParams();
        if (options.category) params.append('category', options.category);
        if (options.featured !== undefined) params.append('featured', options.featured);
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);

        const url = `${API_BASE_URL}/blogs?${params.toString()}`;
        const response = await fetch(url);

        let apiBlogs = [];
        if (response.ok) {
            const apiResult = await response.json();
            if (apiResult.success) {
                apiBlogs = apiResult.data || [];
            }
        }

        // Get admin blogs from localStorage - only published ones
        const adminBlogs = JSON.parse(localStorage.getItem('adminBlogs') || '[]')
            .filter(blog => blog.status === 'published')
            .map(blog => ({
                id: blog.id,
                title: blog.title,
                slug: `admin-${blog.id}`, // Create unique slug for admin blogs
                excerpt: blog.excerpt,
                content: blog.content,
                category: blog.category,
                tags: blog.tags || [],
                authorName: blog.author,
                authorImage: null,
                featuredImage: blog.image,
                readTime: Math.ceil(blog.content.split(' ').length / 200), // Estimate read time
                createdAt: blog.createdAt,
                updatedAt: blog.updatedAt,
                adminId: blog.adminId,
                adminName: blog.adminName,
                isAdminBlog: true // Mark as admin blog
            }));

        // Combine API blogs and admin blogs
        const allBlogs = [...adminBlogs, ...apiBlogs];

        // Apply filtering if needed
        let filteredBlogs = allBlogs;
        if (options.category) {
            filteredBlogs = filteredBlogs.filter(blog =>
                blog.category.toLowerCase() === options.category.toLowerCase()
            );
        }

        // Sort by creation date (newest first)
        filteredBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const offset = options.offset || 0;
        const limit = options.limit || 10;
        const paginatedBlogs = filteredBlogs.slice(offset, offset + limit);

        return {
            success: true,
            data: paginatedBlogs,
            total: filteredBlogs.length,
            hasMore: offset + limit < filteredBlogs.length
        };

    } catch (error) {
        console.error('Error fetching blogs:', error);

        // Fallback: return only admin blogs if API fails
        const adminBlogs = JSON.parse(localStorage.getItem('adminBlogs') || '[]')
            .filter(blog => blog.status === 'published')
            .map(blog => ({
                id: blog.id,
                title: blog.title,
                slug: `admin-${blog.id}`,
                excerpt: blog.excerpt,
                content: blog.content,
                category: blog.category,
                tags: blog.tags || [],
                authorName: blog.author,
                authorImage: null,
                featuredImage: blog.image,
                readTime: Math.ceil(blog.content.split(' ').length / 200),
                createdAt: blog.createdAt,
                updatedAt: blog.createdAt,
                isAdminBlog: true
            }));

        let filteredBlogs = adminBlogs;
        if (options.category) {
            filteredBlogs = filteredBlogs.filter(blog =>
                blog.category.toLowerCase() === options.category.toLowerCase()
            );
        }

        filteredBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const offset = options.offset || 0;
        const limit = options.limit || 10;
        const paginatedBlogs = filteredBlogs.slice(offset, offset + limit);

        return {
            success: true,
            data: paginatedBlogs,
            total: filteredBlogs.length,
            hasMore: offset + limit < filteredBlogs.length
        };
    }
}

/**
 * Fetch featured blog from API
 */
async function fetchFeaturedBlog() {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/featured`);

        if (!response.ok) {
            throw new Error('Failed to fetch featured blog');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching featured blog:', error);
        return { success: false, data: null, error: error.message };
    }
}

/**
 * Fetch single blog by slug
 */
async function fetchBlogBySlug(slug) {
    try {
        // Check if it's an admin blog (starts with 'admin-')
        if (slug.startsWith('admin-')) {
            const adminBlogId = slug.replace('admin-', '');
            const adminBlogs = JSON.parse(localStorage.getItem('adminBlogs') || '[]');
            const adminBlog = adminBlogs.find(blog => blog.id === adminBlogId && blog.status === 'published');

            if (adminBlog) {
                return {
                    success: true,
                    data: {
                        id: adminBlog.id,
                        title: adminBlog.title,
                        slug: slug,
                        excerpt: adminBlog.excerpt,
                        content: adminBlog.content,
                        category: adminBlog.category,
                        tags: adminBlog.tags || [],
                        authorName: adminBlog.author,
                        authorImage: null,
                        featuredImage: adminBlog.image,
                        readTime: Math.ceil(adminBlog.content.split(' ').length / 200),
                        createdAt: adminBlog.createdAt,
                        updatedAt: adminBlog.updatedAt,
                        adminId: adminBlog.adminId,
                        adminName: adminBlog.adminName,
                        isAdminBlog: true
                    }
                };
            }
        }

        // Try API for regular blogs
        const response = await fetch(`${API_BASE_URL}/blogs/slug/${slug}`);

        if (!response.ok) {
            throw new Error('Failed to fetch blog');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching blog:', error);
        return { success: false, data: null, error: error.message };
    }
}

/**
 * Fetch blog categories from API and admin blogs
 */
async function fetchCategories() {
    try {
        // Try to get categories from API
        let apiCategories = [];
        try {
            const response = await fetch(`${API_BASE_URL}/blogs/categories`);
            if (response.ok) {
                const apiResult = await response.json();
                if (apiResult.success) {
                    apiCategories = apiResult.data || [];
                }
            }
        } catch (apiError) {
            console.warn('API categories not available, using admin categories only');
        }

        // Get categories from admin blogs (only published ones)
        const adminBlogs = JSON.parse(localStorage.getItem('adminBlogs') || '[]')
            .filter(blog => blog.status === 'published');

        const adminCategories = {};
        adminBlogs.forEach(blog => {
            const category = blog.category;
            if (adminCategories[category]) {
                adminCategories[category]++;
            } else {
                adminCategories[category] = 1;
            }
        });

        const adminCategoriesArray = Object.keys(adminCategories).map(name => ({
            name: name,
            count: adminCategories[name]
        }));

        // Combine API and admin categories
        const allCategories = [...apiCategories];

        // Merge admin categories with API categories
        adminCategoriesArray.forEach(adminCat => {
            const existingCat = allCategories.find(cat => cat.name === adminCat.name);
            if (existingCat) {
                existingCat.count += adminCat.count;
            } else {
                allCategories.push(adminCat);
            }
        });

        return {
            success: true,
            data: allCategories
        };

    } catch (error) {
        console.error('Error fetching categories:', error);

        // Fallback: return categories from admin blogs only
        const adminBlogs = JSON.parse(localStorage.getItem('adminBlogs') || '[]')
            .filter(blog => blog.status === 'published');

        const adminCategories = {};
        adminBlogs.forEach(blog => {
            const category = blog.category;
            if (adminCategories[category]) {
                adminCategories[category]++;
            } else {
                adminCategories[category] = 1;
            }
        });

        const adminCategoriesArray = Object.keys(adminCategories).map(name => ({
            name: name,
            count: adminCategories[name]
        }));

        return {
            success: true,
            data: adminCategoriesArray
        };
    }
}

/**
 * Fetch related blogs
 */
async function fetchRelatedBlogs(category, excludeSlug, limit = 3) {
    try {
        const params = new URLSearchParams();
        if (excludeSlug) params.append('exclude', excludeSlug);
        if (limit) params.append('limit', limit);

        const response = await fetch(`${API_BASE_URL}/blogs/related/${encodeURIComponent(category)}?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch related blogs');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching related blogs:', error);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * Search blogs
 */
async function searchBlogs(query, limit = 10) {
    try {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('limit', limit);

        const response = await fetch(`${API_BASE_URL}/blogs/search?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to search blogs');
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching blogs:', error);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * Get URL parameter
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Initialize blog listing page
 */
async function initBlogListingPage() {
    const featuredSection = document.getElementById('featured-blog-section');
    const blogGrid = document.getElementById('blog-grid');
    const categoryPills = document.getElementById('category-pills');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadingSpinner = document.getElementById('loading-spinner');

    let currentOffset = 0;
    const limit = 6;
    let currentCategory = null;
    let currentTag = getUrlParam('tag'); // Check for tag in URL

    // Show loading state
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    // Update page heading if filtering by tag
    if (currentTag) {
        const pageHeading = document.getElementById('page-heading');
        const pageDescription = document.getElementById('page-description');
        if (pageHeading) {
            pageHeading.innerHTML = `Posts tagged <span class="italic text-primary font-normal">#${currentTag}</span>`;
        }
        if (pageDescription) {
            pageDescription.innerHTML = `Showing all blog posts tagged with #${currentTag}. <a href="blog.html" class="text-primary hover:underline">View all posts</a>`;
        }
        // Hide featured section when filtering by tag
        if (featuredSection) {
            featuredSection.parentElement.style.display = 'none';
        }
    } else {
        // Load featured blog only when not filtering
        if (featuredSection) {
            const featuredResult = await fetchFeaturedBlog();
            if (featuredResult.success && featuredResult.data) {
                featuredSection.innerHTML = createFeaturedBlog(featuredResult.data);
            }
        }
    }

    // Load categories for filter pills
    if (categoryPills) {
        const categoriesResult = await fetchCategories();
        if (categoriesResult.success && categoriesResult.data) {
            let pillsHtml = `
                <button data-category="" 
                    class="category-pill active px-6 py-2.5 rounded-full text-sm font-bold bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 shadow-sm">
                    All Posts
                </button>
            `;

            categoriesResult.data.forEach(cat => {
                pillsHtml += `
                    <button data-category="${cat.name}"
                        class="category-pill px-6 py-2.5 rounded-full text-sm font-bold bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 shadow-sm hover:border-primary">
                        ${cat.name} (${cat.count})
                    </button>
                `;
            });

            categoryPills.innerHTML = pillsHtml;

            // Add click handlers
            categoryPills.querySelectorAll('.category-pill').forEach(pill => {
                pill.addEventListener('click', async function () {
                    categoryPills.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                    this.classList.add('active');

                    currentCategory = this.dataset.category || null;
                    currentOffset = 0;
                    await loadBlogs(true);
                });
            });
        }
    }

    // Load blogs
    async function loadBlogs(reset = false) {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');

        let result;

        // If filtering by tag, use tag search API
        if (currentTag) {
            const response = await fetch(`${API_BASE_URL}/blogs/tags/${encodeURIComponent(currentTag)}?limit=${limit}&offset=${currentOffset}`);
            if (response.ok) {
                result = await response.json();
            } else {
                result = { success: false, data: [] };
            }
        } else {
            // Regular blog listing
            const options = {
                limit,
                offset: currentOffset,
                featured: false  // Exclude featured from grid
            };

            if (currentCategory) {
                options.category = currentCategory;
            }

            result = await fetchBlogs(options);
        }

        if (loadingSpinner) loadingSpinner.classList.add('hidden');

        if (result.success && result.data) {
            const blogsHtml = result.data.map((blog, index) => createBlogCard(blog, index)).join('');

            if (reset) {
                blogGrid.innerHTML = blogsHtml;
            } else {
                blogGrid.insertAdjacentHTML('beforeend', blogsHtml);
            }

            currentOffset += result.data.length;

            // Show/hide load more button
            if (loadMoreBtn) {
                if (result.pagination && result.pagination.hasMore) {
                    loadMoreBtn.classList.remove('hidden');
                } else {
                    loadMoreBtn.classList.add('hidden');
                }
            }
        }
    }

    // Initial load
    await loadBlogs(true);

    // Load more handler
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => loadBlogs(false));
    }

    // Refresh handler
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            // Load ALL blogs for refresh (not just first batch)
            const allBlogsLimit = 1000; // Load up to 1000 blogs
            const options = {
                limit: allBlogsLimit,
                offset: 0,
                featured: false
            };

            if (currentCategory) {
                options.category = currentCategory;
            }

            if (loadingSpinner) loadingSpinner.classList.remove('hidden');

            let result;
            if (currentTag) {
                const response = await fetch(`${API_BASE_URL}/blogs/tags/${encodeURIComponent(currentTag)}?limit=${allBlogsLimit}&offset=0`);
                if (response.ok) {
                    result = await response.json();
                } else {
                    result = { success: false, data: [] };
                }
            } else {
                result = await fetchBlogs(options);
            }

            if (loadingSpinner) loadingSpinner.classList.add('hidden');

            if (result.success && result.data) {
                const blogsHtml = result.data.map((blog, index) => createBlogCard(blog, index)).join('');
                blogGrid.innerHTML = blogsHtml;

                // Reset offset for future load more operations
                currentOffset = result.data.length;

                // Hide load more button since we loaded everything
                if (loadMoreBtn) {
                    loadMoreBtn.classList.add('hidden');
                }

                // Show success message
                const originalText = refreshBtn.innerHTML;
                refreshBtn.innerHTML = '<span class="material-symbols-outlined text-lg mr-2">check_circle</span>All Blogs Loaded!';
                refreshBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                refreshBtn.classList.remove('bg-primary', 'hover:bg-primary/90');
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    refreshBtn.classList.add('bg-primary', 'hover:bg-primary/90');
                }, 2000);
            }
        });
    }

    // Auto-refresh when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            // Page became visible, refresh blogs
            currentOffset = 0;
            await loadBlogs(true);
        }
    });
}

/**
 * Fetch comments for a blog
 */
async function fetchComments(blogId, limit = 20, offset = 0) {
    try {
        const params = new URLSearchParams();
        params.append('limit', limit);
        params.append('offset', offset);

        const url = `${API_BASE_URL}/blogs/${blogId}/comments?${params.toString()}`;
        console.log('Fetching comments from:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Failed to fetch comments, status:', response.status);
            throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        console.log('Comments API response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching comments:', error);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * Post a comment to a blog
 */
async function postComment(blogId, author, content) {
    try {
        const url = `${API_BASE_URL}/blogs/${blogId}/comments`;
        console.log('=== POSTING COMMENT ===');
        console.log('Posting comment to:', url);
        console.log('Blog ID:', blogId);
        console.log('Author:', author);
        console.log('Content:', content);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ author, content }),
        });

        console.log('Post response status:', response.status);
        console.log('Post response ok:', response.ok);

        if (!response.ok) {
            console.error('Post comment failed, status:', response.status);
            throw new Error('Failed to post comment');
        }

        const data = await response.json();
        console.log('Post comment response data:', data);
        return data;
    } catch (error) {
        console.error('Error posting comment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Post a reply to a comment
 */
async function postReply(commentId, author, content) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/comments/${commentId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ author, content }),
        });

        if (!response.ok) {
            throw new Error('Failed to post reply');
        }

        return await response.json();
    } catch (error) {
        console.error('Error posting reply:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a comment
 */
async function deleteComment(commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/comments/${commentId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Like or unlike a comment
 */
async function toggleCommentLike(commentId, userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to toggle like');
        }

        return await response.json();
    } catch (error) {
        console.error('Error toggling like:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create comment HTML with likes and replies support
 */
function createCommentHTML(comment, isReply = false) {
    const timeAgo = getTimeAgo(comment.createdAt);
    const userId = getUserIdentifier(); // Get user identifier for likes
    const commentClass = isReply ? 'ml-12 mt-4' : '';

    // Check if user has liked this comment (stored in localStorage)
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    const isLiked = likedComments.includes(comment.id);

    const likeButtonClass = isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500';
    const likeIcon = isLiked ? 'favorite' : 'favorite_border';

    let repliesHTML = '';
    if (comment.replies && comment.replies.length > 0) {
        repliesHTML = comment.replies.map(reply => createCommentHTML(reply, true)).join('');
    }

    return `
        <div class="comment-item ${commentClass} glass-card rounded-2xl p-6" data-comment-id="${comment.id}">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-lg">person</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-bold text-gray-900 dark:text-white">${escapeHTML(comment.author)}</h4>
                        <span class="text-xs text-gray-400">${timeAgo}</span>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">${escapeHTML(comment.content)}</p>

                    <!-- Action buttons -->
                    <div class="flex items-center gap-4">
                        <button class="like-btn flex items-center gap-1 text-sm ${likeButtonClass} transition-colors"
                                data-comment-id="${comment.id}">
                            <span class="material-symbols-outlined text-base">${likeIcon}</span>
                            <span class="likes-count">${comment.likes || 0}</span>
                        </button>
                        <button class="reply-btn flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition-colors"
                                data-comment-id="${comment.id}">
                            <span class="material-symbols-outlined text-base">reply</span>
                            <span>Reply</span>
                        </button>
                        <button class="delete-comment-btn flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
                                data-comment-id="${comment.id}">
                            <span class="material-symbols-outlined text-base">delete</span>
                            <span>Delete</span>
                        </button>
                    </div>

                    <!-- Reply form (hidden by default) -->
                    <div class="reply-form hidden mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                        <form class="reply-comment-form space-y-3">
                            <input type="text" name="author" required
                                class="w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white"
                                placeholder="Your name" />
                            <textarea name="content" required rows="2"
                                class="w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white resize-none"
                                placeholder="Write a reply..."></textarea>
                            <div class="flex justify-end gap-2">
                                <button type="button" class="cancel-reply-btn px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    Cancel
                                </button>
                                <button type="submit" class="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                                    Reply
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Replies container -->
                    <div class="replies-container mt-4">
                        ${repliesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get time ago string
 */
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return formatDate(dateString);
}

/**
 * Get user identifier for likes (using IP-like identifier)
 */
function getUserIdentifier() {
    let userId = localStorage.getItem('userIdentifier');
    if (!userId) {
        // Generate a simple identifier based on timestamp and random number
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userIdentifier', userId);
    }
    return userId;
}

/**
 * Add comment to liked list
 */
function addLikedComment(commentId) {
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    if (!likedComments.includes(commentId)) {
        likedComments.push(commentId);
        localStorage.setItem('likedComments', JSON.stringify(likedComments));
    }
}

/**
 * Remove comment from liked list
 */
function removeLikedComment(commentId) {
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    const index = likedComments.indexOf(commentId);
    if (index > -1) {
        likedComments.splice(index, 1);
        localStorage.setItem('likedComments', JSON.stringify(likedComments));
    }
}

/**
 * Initialize comments for a blog
 */
async function initBlogComments(blogId) {
    const commentsList = document.getElementById('comments-list');
    const commentsLoading = document.getElementById('comments-loading');
    const noComments = document.getElementById('no-comments');
    const commentForm = document.getElementById('comment-form');
    const commentMessage = document.getElementById('comment-message');

    // Load comments
    async function loadComments() {
        if (commentsLoading) {
            commentsLoading.classList.remove('hidden');
        }
        if (noComments) {
            noComments.classList.add('hidden');
        }

        const result = await fetchComments(blogId);

        if (commentsLoading) {
            commentsLoading.classList.add('hidden');
        }

        if (result.success && result.data && result.data.length > 0) {
            const commentsHTML = result.data.map(comment => createCommentHTML(comment)).join('');

            if (commentsList) {
                commentsList.innerHTML = commentsHTML;
                attachCommentEventListeners();
            } else {
                console.error('commentsList element not found!');
            }
        } else {
            if (commentsList) {
                commentsList.innerHTML = '';
            }
            if (noComments) {
                noComments.classList.remove('hidden');
            }
        }
    }

    // Attach event listeners to comment buttons
    function attachCommentEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;
                const userId = getUserIdentifier();

                const result = await toggleCommentLike(commentId, userId);
                if (result.success) {
                    const likesCountEl = btn.querySelector('.likes-count');
                    const iconEl = btn.querySelector('.material-symbols-outlined');

                    likesCountEl.textContent = result.likesCount;

                    if (result.liked) {
                        btn.classList.remove('text-gray-400', 'hover:text-red-500');
                        btn.classList.add('text-red-500');
                        iconEl.textContent = 'favorite';
                        addLikedComment(commentId);
                    } else {
                        btn.classList.remove('text-red-500');
                        btn.classList.add('text-gray-400', 'hover:text-red-500');
                        iconEl.textContent = 'favorite_border';
                        removeLikedComment(commentId);
                    }
                }
            });
        });

        // Reply buttons
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;
                const commentItem = btn.closest('.comment-item');
                const replyForm = commentItem.querySelector('.reply-form');

                // Hide all other reply forms
                document.querySelectorAll('.reply-form').forEach(form => {
                    if (form !== replyForm) {
                        form.classList.add('hidden');
                    }
                });

                // Toggle this reply form
                replyForm.classList.toggle('hidden');

                if (!replyForm.classList.contains('hidden')) {
                    replyForm.querySelector('input[name="author"]').focus();
                }
            });
        });

        // Cancel reply buttons
        document.querySelectorAll('.cancel-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const replyForm = btn.closest('.reply-form');
                replyForm.classList.add('hidden');
            });
        });

        // Reply forms
        document.querySelectorAll('.reply-comment-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const commentItem = form.closest('.comment-item');
                const commentId = commentItem.dataset.commentId;
                const author = form.querySelector('input[name="author"]').value.trim();
                const content = form.querySelector('textarea[name="content"]').value.trim();

                if (!author || !content) {
                    showMessage('Please fill in all fields', 'error');
                    return;
                }

                // Disable form during submission
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Posting...';

                const result = await postReply(commentId, author, content);

                submitBtn.disabled = false;
                submitBtn.textContent = 'Reply';

                if (result.success) {
                    form.reset();
                    form.closest('.reply-form').classList.add('hidden');
                    showMessage('Reply posted successfully!', 'success');
                    // Reload comments to show the new reply
                    await loadComments();
                } else {
                    showMessage(result.error || 'Failed to post reply', 'error');
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;

                if (confirm('Are you sure you want to delete this comment?')) {
                    const result = await deleteComment(commentId);
                    if (result.success) {
                        showMessage('Comment deleted successfully', 'success');
                        // Remove from DOM
                        const commentEl = btn.closest('.comment-item');
                        if (commentEl) commentEl.remove();

                        // Check if list is now empty and show "no comments" if needed
                        const commentsList = document.getElementById('comments-list');
                        if (commentsList && commentsList.children.length === 0) {
                            const noComments = document.getElementById('no-comments');
                            if (noComments) noComments.classList.remove('hidden');
                        }
                    } else {
                        showMessage(result.error || 'Failed to delete comment', 'error');
                    }
                }
            });
        });
    }

    // Handle comment form submission
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const author = document.getElementById('comment-author').value.trim();
            const content = document.getElementById('comment-content').value.trim();

            if (!author || !content) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            // Disable form during submission
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            const result = await postComment(blogId, author, content);

            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Comment';

            if (result.success) {
                // Instead of reloading all comments, add the new comment directly to the UI
                const newComment = {
                    id: result.data.id,
                    author: author,
                    content: content,
                    likes: 0,
                    createdAt: new Date().toISOString(),
                    replies: []
                };

                // Hide "no comments" message if it was showing
                if (noComments && !noComments.classList.contains('hidden')) {
                    noComments.classList.add('hidden');
                }

                // Add the new comment to the top of the list
                const newCommentHTML = createCommentHTML(newComment);

                if (commentsList) {
                    // If there are no comments yet, just set the HTML
                    if (commentsList.innerHTML.trim() === '') {
                        commentsList.innerHTML = newCommentHTML;
                    } else {
                        // Prepend the new comment
                        commentsList.innerHTML = newCommentHTML + commentsList.innerHTML;
                    }

                    // Re-attach event listeners for the new comment
                    attachCommentEventListeners();
                }

                showMessage('Comment posted successfully!', 'success');
                commentForm.reset();
            } else {
                console.error('Failed to post comment:', result.error);
                showMessage(result.error || 'Failed to post comment', 'error');
            }
        });
    }

    function showMessage(message, type) {
        if (!commentMessage) return;

        commentMessage.textContent = message;
        commentMessage.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'bg-red-50', 'text-red-800',
            'dark:bg-green-900/20', 'dark:text-green-400', 'dark:bg-red-900/20', 'dark:text-red-400');

        if (type === 'success') {
            commentMessage.classList.add('bg-green-50', 'text-green-800', 'dark:bg-green-900/20', 'dark:text-green-400');
        } else {
            commentMessage.classList.add('bg-red-50', 'text-red-800', 'dark:bg-red-900/20', 'dark:text-red-400');
        }

        setTimeout(() => {
            commentMessage.classList.add('hidden');
        }, 5000);
    }

    // Initial load
    await loadComments();
}

/**
 * Initialize blog article page
 */
async function initBlogArticlePage() {
    let slug = getUrlParam('slug');

    // If no slug provided, use a default blog for testing
    if (!slug) {
        console.log('No slug provided, using default blog for testing');
        slug = 'top-5-cs-universities-2026'; // Default test blog
    }

    console.log('Initializing blog article page with slug:', slug);

    const articleContent = document.getElementById('article-content');
    const articleTitle = document.getElementById('article-title');
    const articleExcerpt = document.getElementById('article-excerpt');
    const articleCategory = document.getElementById('article-category');
    const articleImage = document.getElementById('article-image');
    const authorName = document.getElementById('author-name');
    const authorRole = document.getElementById('author-role');
    const authorImage = document.getElementById('author-image');
    const publishDate = document.getElementById('publish-date');
    const readTime = document.getElementById('read-time');
    const viewCount = document.getElementById('view-count');
    const relatedBlogs = document.getElementById('related-blogs');

    // Fetch blog data
    console.log('Fetching blog data for slug:', slug);
    const result = await fetchBlogBySlug(slug);
    console.log('Blog fetch result:', result);

    if (!result.success || !result.data) {
        console.error('Blog not found or fetch failed');
        if (articleContent) {
            articleContent.innerHTML = '<p class="text-center text-gray-500">Blog not found</p>';
        }
        return;
    }

    const blog = result.data;
    console.log('Blog data:', blog);

    // Update page title
    document.title = `${blog.title} - LoanHero Blog`;

    // Update article elements
    if (articleTitle) articleTitle.textContent = blog.title;
    if (articleExcerpt) articleExcerpt.textContent = blog.excerpt;
    if (articleCategory) articleCategory.textContent = blog.category;
    if (articleImage) articleImage.src = blog.featuredImage || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80';
    if (authorName) authorName.textContent = blog.authorName;
    if (authorRole) authorRole.textContent = blog.authorRole || 'Author';
    if (authorImage) authorImage.src = blog.authorImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80';
    if (publishDate) publishDate.textContent = formatDate(blog.publishedAt);
    if (readTime) readTime.textContent = `${blog.readTime} min read`;
    if (viewCount) viewCount.textContent = `${blog.views.toLocaleString()} views`;
    if (articleContent) articleContent.innerHTML = blog.content;

    // Render tags
    const articleTags = document.getElementById('article-tags');
    if (articleTags && blog.tags && blog.tags.length > 0) {
        const tagsHTML = blog.tags.map(tag => `
            <a href="blog.html?tag=${encodeURIComponent(tag)}"
                class="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer">
                #${tag}
            </a>
        `).join('');
        articleTags.innerHTML = tagsHTML;
    }

    // Initialize comments
    console.log('Initializing comments for blog ID:', blog.id);
    await initBlogComments(blog.id);

    // Fetch and display related blogs
    if (relatedBlogs) {
        const relatedResult = await fetchRelatedBlogs(blog.category, slug, 3);

        if (relatedResult.success && relatedResult.data && relatedResult.data.length > 0) {
            let relatedHtml = '';
            relatedResult.data.forEach((relBlog, index) => {
                relatedHtml += createBlogCard(relBlog, index);
            });
            relatedBlogs.innerHTML = relatedHtml;
        } else {
            // Hide related section if no related blogs
            const relatedSection = document.getElementById('related-section');
            if (relatedSection) relatedSection.classList.add('hidden');
        }
    }
}

// Export functions for use in HTML
window.BlogAPI = {
    fetchBlogs,
    fetchFeaturedBlog,
    fetchBlogBySlug,
    fetchCategories,
    fetchRelatedBlogs,
    searchBlogs,
    fetchComments,
    postComment,
    postReply,
    toggleCommentLike,
    initBlogListingPage,
    initBlogArticlePage,
    initBlogComments,
    createBlogCard,
    createFeaturedBlog,
    formatDate,
    getUrlParam
};
