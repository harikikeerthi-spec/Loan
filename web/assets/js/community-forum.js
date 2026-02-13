const API_BASE_URL = 'http://localhost:3000/community';
const AUTH_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Auto-refresh wrapper: tries the request, and if 401, refreshes the token and retries once
async function authFetch(url, options = {}) {
    let token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(url, options);

    if (response.status === 401) {
        // Try to refresh the token
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
            try {
                const refreshRes = await fetch('http://localhost:3000/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (data.success && data.access_token) {
                        localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
                        if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
                        // Retry original request with new token
                        options.headers['Authorization'] = `Bearer ${data.access_token}`;
                        response = await fetch(url, options);
                    }
                }
            } catch (e) {
                console.error('Token refresh failed:', e);
            }
        }
    }
    return response;
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';
    const postId = urlParams.get('post');
    initializeHub(topic, postId);
});

async function initializeHub(topic, postId) {
    try {
        await loadHubData(topic);
        setupAuthUI(topic);
        if (postId) scrollToPost(postId);
    } catch (error) {
        console.error('Initialization failed:', error);
        showToast('Failed to load community hub', 'error');
    }
}

async function loadHubData(topic) {
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`http://localhost:3000/community/explore/hub/${topic}`, { headers });
        const result = await response.json();
        if (result.success) {
            updateHeader(result.data.hub);
            renderMentors(result.data.mentors);
            renderEvents(result.data.events);
            renderResources(result.data.resources);
            renderFeed(result.data.forumPosts);
            const adviceEl = document.getElementById('mentorAdvice');
            if (adviceEl && result.data.hub.advice) adviceEl.textContent = result.data.hub.advice;
        }
    } catch (error) {
        document.getElementById('postsContainer').innerHTML = `
            <div class="glass-panel p-8 text-center text-red-500">Failed to load content.</div>`;
    }
}

function updateHeader(hub) {
    document.getElementById('topicTitle').textContent = hub.title;
    document.getElementById('topicDescription').textContent = hub.description;
    animateValue(document.getElementById('statMembers'), 0, hub.stats?.members || 120, 2000);
    animateValue(document.getElementById('statDiscussions'), 0, hub.stats?.discussions || 45, 2000);
    const badge = document.getElementById('topicBadge');
    if (badge) badge.textContent = hub.badge || hub.topic.toUpperCase();
}

function renderFeed(posts) {
    const container = document.getElementById('postsContainer');
    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="glass-panel p-12 text-center rounded-3xl">
                <div class="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-rounded text-3xl text-gray-400">forum</span>
                </div>
                <h3 class="text-xl font-bold mb-2">No discussions yet</h3>
                <p class="text-gray-500">Be the first to start a conversation!</p>
            </div>`;
        return;
    }
    container.innerHTML = posts.map(createPostHTML).join('');
    container.removeEventListener('click', handleFeedInteractions); // Clean up
    container.addEventListener('click', handleFeedInteractions);
}

function createPostHTML(post) {
    const userInitials = post.author?.firstName ? post.author.firstName[0] : 'U';
    const timeAgo = getTimeAgo(post.createdAt);

    // Ensure likes and commentCount are numbers
    const likes = post.likes || 0;
    const commentCount = post.commentCount || 0;
    const views = post.views || 0;

    // Get current topic from URL
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';

    // Check if current user is admin
    const currentUserRole = localStorage.getItem('userRole');
    const isAdmin = currentUserRole === 'admin';

    return `
        <div id="post-${post.id}" class="glass-panel p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:shadow-brand-900/5 group mb-6 cursor-pointer" data-post-id="${post.id}">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/50 dark:to-accent-900/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg shadow-inner">
                        ${userInitials}
                    </div>
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-bold text-gray-900 dark:text-white truncate">
                            ${post.author?.firstName || 'User'} ${post.author?.lastName || ''}
                            ${post.author?.role === 'admin' ? '<span class="ml-2 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold uppercase">Admin</span>' : ''}
                            ${post.author?.role === 'mentor' ? '<span class="ml-2 px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-[10px] font-bold uppercase">Mentor</span>' : ''}
                        </h4>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                            ${isAdmin ? `
                                <button data-action="delete-post" data-id="${post.id}" 
                                        class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10 relative"
                                        title="Delete Post">
                                    <span class="material-symbols-rounded text-lg">delete</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <h3 class="font-display font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 leading-tight hover:text-brand-600 dark:hover:text-brand-400 transition-colors">${post.title || 'Discussion'}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3">${post.content}</p>

                    <div class="flex items-center gap-6 border-t border-gray-100 dark:border-white/5 pt-4">
                        <button data-action="like-post" data-id="${post.id}" class="flex items-center gap-2 text-xs font-bold ${post.liked ? 'text-pink-500' : 'text-gray-500'} hover:text-pink-500 transition-colors group/btn z-10 relative">
                            <span class="material-symbols-rounded text-lg ${post.liked ? 'fill-current' : ''}">favorite</span>
                            <span class="likes-count">${likes}</span>
                        </button>
                        <button data-action="view-discussion" data-id="${post.id}" data-topic="${topic}" class="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-500 transition-colors group/btn z-10 relative">
                            <span class="material-symbols-rounded text-lg">chat_bubble</span>
                            <span class="comments-count">${commentCount}</span> Answers
                        </button>
                        <div class="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <span class="material-symbols-rounded text-lg">visibility</span>
                            <span>${views}</span> Views
                        </div>
                        <button data-action="share-post" data-id="${post.id}" class="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors group/btn z-10 relative">
                            <span class="material-symbols-rounded text-lg">share</span>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
}

async function handleFeedInteractions(e) {
    const btn = e.target.closest('button');

    // If clicking on a button, handle button action
    if (btn) {
        e.stopPropagation(); // Prevent card click
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const topic = btn.dataset.topic;
        const parentId = btn.dataset.parentid; // for nested replies

        if (action === 'like-post') handleLikePost(id, btn);
        if (action === 'like-comment') handleLikeComment(id, btn);
        if (action === 'view-discussion') {
            window.location.href = `question-discussion.html?id=${id}&topic=${topic}`;
        }
        if (action === 'delete-post') handleDeletePost(id);
        if (action === 'submit-comment') submitComment(id, parentId, btn);
        if (action === 'reply-to-comment') showReplyInput(id);
        if (action === 'share-post') handleSharePost(id);
        return;
    }

    // If clicking on the card itself (not a button), navigate to discussion
    const card = e.target.closest('[data-post-id]');
    if (card && !e.target.closest('button')) {
        const postId = card.dataset.postId;
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get('topic') || 'general';
        window.location.href = `question-discussion.html?id=${postId}&topic=${topic}`;
    }
}

// --- Interactions ---

async function handleLikePost(postId, btn) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return showToast('Please login to like', 'info');

    const countEl = btn.querySelector('.likes-count');
    const icon = btn.querySelector('.material-symbols-rounded');
    if (btn.disabled) return;
    btn.disabled = true;

    try {
        const response = await authFetch(`${API_BASE_URL}/forum/${postId}/like`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            countEl.textContent = data.likes;
            if (data.liked) {
                btn.classList.add('text-pink-500');
                btn.classList.remove('text-gray-500');
                icon.classList.add('fill-current');
            } else {
                btn.classList.remove('text-pink-500');
                btn.classList.add('text-gray-500');
                icon.classList.remove('fill-current');
            }
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            showToast('Failed to like post', 'error');
        }
    } catch (e) {
        showToast('Error liking post', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function handleLikeComment(commentId, btn) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return showToast('Please login to like', 'info');

    const countEl = btn.querySelector('.likes-count');
    const icon = btn.querySelector('.material-symbols-rounded'); // Assuming comments use the same icon class structure or similar
    if (btn.disabled) return;
    btn.disabled = true;

    try {
        const response = await authFetch(`${API_BASE_URL}/forum/comments/${commentId}/like`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            countEl.textContent = data.likes;
            if (data.liked) {
                btn.classList.add('text-pink-500');
                btn.classList.remove('text-gray-400');
                if (icon) icon.classList.add('fill-current');
            } else {
                btn.classList.remove('text-pink-500');
                btn.classList.add('text-gray-400');
                if (icon) icon.classList.remove('fill-current');
            }
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            showToast('Failed to like comment', 'error');
        }
    } catch (e) {
        showToast('Error liking comment', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function handleDeletePost(postId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/forum/${postId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Post deleted successfully');
            // Remove the post from DOM
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
                postElement.style.animation = 'fade-out 0.3s ease-out';
                setTimeout(() => postElement.remove(), 300);
            }
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else if (response.status === 403) {
            showToast('You do not have permission to delete this post', 'error');
        } else {
            showToast('Failed to delete post', 'error');
        }
    } catch (e) {
        console.error('Delete error:', e);
        showToast('Error deleting post', 'error');
    }
}

async function handleSharePost(postId) {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';
    const shareUrl = `${window.location.origin}/question-discussion.html?id=${postId}&topic=${topic}`;

    // Copy to clipboard
    try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!', 'success');

        // Track share
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        // Only track if user is logged in, but allow sharing regardless
        if (token) {
            fetch(`${API_BASE_URL}/forum/${postId}/share`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => { }); // Ignore tracking errors
        }
    } catch (err) {
        showToast('Failed to copy link', 'error');
    }
}

async function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    const inputArea = section.querySelector('.comment-input-area');
    const loginPrompt = section.querySelector('.login-prompt');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        if (token) inputArea.classList.remove('hidden');
        else loginPrompt.classList.remove('hidden');
        loadComments(postId, section.querySelector('.comments-list'));
    } else {
        section.classList.add('hidden');
    }
}

async function loadComments(postId, container) {
    container.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div></div>';
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/forum/${postId}`, { headers });
        const result = await response.json();
        if (result.success && result.data.comments) {
            renderCommentList(result.data.comments, container, postId);
        }
    } catch (e) {
        container.innerHTML = '<p class="text-red-500 text-xs text-center">Failed to load comments.</p>';
    }
}

function renderCommentList(comments, container, postId) {
    if (comments.length === 0) {
        container.innerHTML = '<p class="text-center text-xs text-gray-400 italic py-2">No conversations yet.</p>';
        return;
    }
    container.innerHTML = comments.map(c => createCommentHTML(c, postId)).join('');
}

function createCommentHTML(comment, postId, isReply = false) {
    const repliesHTML = comment.replies && comment.replies.length > 0
        ? `<div class="ml-10 pl-4 border-l-2 border-gray-100 dark:border-white/5 space-y-4 mt-4">
             ${comment.replies.map(r => createCommentHTML(r, postId, true)).join('')}
           </div>`
        : '';

    return `
    <div class="animate-fade-in-up group/comment relative">
        <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                ${comment.author?.firstName?.[0] || 'U'}
            </div>
            <div class="flex-1">
                <div class="bg-gray-50 dark:bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <div class="flex justify-between items-baseline mb-1">
                        <span class="text-xs font-bold text-gray-900 dark:text-white">${comment.author?.firstName}</span>
                        <span class="text-[10px] text-gray-400">${getTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p class="text-sm text-gray-700 dark:text-gray-300">${comment.content}</p>
                </div>
                
                <div class="flex items-center gap-4 mt-1 ml-2">
                    <button data-action="like-comment" data-id="${comment.id}" class="text-[10px] font-bold ${comment.liked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500 flex items-center gap-1">
                        <span class="material-symbols-rounded text-sm ${comment.liked ? 'fill-current' : ''}">favorite</span> <span class="likes-count">${comment.likes || 0}</span>
                    </button>
                    <button data-action="reply-to-comment" data-id="${comment.id}" class="text-[10px] font-bold text-gray-400 hover:text-brand-500">Reply</button>
                </div>

                <!-- Hidden Reply Input for Nested Comment -->
                <div id="reply-input-${comment.id}" class="hidden mt-2 flex gap-2 animate-fade-in-up">
                    <textarea placeholder="Write a reply..." class="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-xs resize-none focus:ring-1 focus:ring-brand-500"></textarea>
                    <button data-action="submit-comment" data-id="${postId}" data-parentid="${comment.id}" class="p-2 bg-brand-500 text-white rounded-lg shadow hover:bg-brand-600 self-end">
                        <span class="material-symbols-rounded text-sm block">send</span>
                    </button>
                </div>
            </div>
        </div>
        ${repliesHTML}
    </div>`;
}

function showReplyInput(commentId) {
    const inputDiv = document.getElementById(`reply-input-${commentId}`);
    if (inputDiv) {
        inputDiv.classList.toggle('hidden');
        if (!inputDiv.classList.contains('hidden')) {
            inputDiv.querySelector('textarea').focus();
        }
    } else {
        showToast('Login to reply', 'info');
    }
}

async function submitComment(postId, parentId, btn) {
    let textarea;
    if (parentId) {
        textarea = document.getElementById(`reply-input-${parentId}`).querySelector('textarea');
    } else {
        textarea = document.getElementById(`input-root-${postId}`);
    }

    const content = textarea.value.trim();
    if (!content) return;

    btn.disabled = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    try {
        const body = { content };
        if (parentId) body.parentId = parentId;

        const response = await authFetch(`${API_BASE_URL}/forum/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const result = await response.json();
            textarea.value = '';

            // If reply, hide input
            if (parentId) document.getElementById(`reply-input-${parentId}`).classList.add('hidden');

            // Reload comments to show hierarchy correctly, or optimistically append if it's a root comment
            const listContainer = document.querySelector(`#comments-${postId} .comments-list`);

            // For simplicity and correctness with nested replies, we reload the comment list
            // But to make it feel "dynamic", one could append the HTML directly. 
            // Given the nested structure, reloading is safer to get the fresh tree.
            await loadComments(postId, listContainer);

            // Update comment count
            const countBtn = document.querySelector(`button[data-id="${postId}"][data-action="toggle-comments"] .comments-count`);
            if (countBtn) {
                countBtn.textContent = parseInt(countBtn.textContent || '0') + 1;
            }
            showToast('Comment posted!', 'success');
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            showToast(`Failed to post comment: ${response.statusText}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Failed to post comment', 'error');
    }
    finally { btn.disabled = false; }
}

// ... (renderMentors, renderEvents, renderResources, setupAuthUI, animateValue, getTimeAgo, showToast, scrollToPost - keep same as before or assumed present)
function renderMentors(mentors) {
    const list = document.getElementById('mentorsList');
    const widget = document.getElementById('topicMentorsWidget');
    if (!list || !widget) return;
    if (mentors?.length) {
        widget.classList.remove('hidden');
        list.innerHTML = mentors.map(m => `
            <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                <img src="${m.image || 'assets/img/avatar_1.png'}" class="w-10 h-10 rounded-full object-cover">
                <div><h4 class="font-bold text-sm dark:text-white">${m.name}</h4><p class="text-xs text-gray-500">${m.university}</p></div>
            </div>`).join('');
    }
}

function renderEvents(events) {
    const list = document.getElementById('eventsList');
    const widget = document.getElementById('topicEventsWidget');
    if (!list || !widget) return;
    if (events?.length) {
        widget.classList.remove('hidden');
        list.innerHTML = events.map(e => `
            <div class="p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-brand-500/30">
                <span class="text-[10px] font-bold text-accent-600 bg-accent-50 px-2 py-1 rounded">${new Date(e.date).toLocaleDateString()}</span>
                <h4 class="font-bold text-sm mt-1 dark:text-white">${e.title}</h4>
            </div>`).join('');
    }
}

function renderResources(resources) {
    const list = document.getElementById('resourcesList');
    const widget = document.getElementById('topicResourcesWidget');
    if (resources?.length) {
        widget.classList.remove('hidden');
        list.innerHTML = resources.map(r => `
            <a href="#" class="flex gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl">
                 <span class="material-symbols-rounded text-orange-600">description</span>
                 <div><h4 class="font-bold text-sm dark:text-white">${r.title}</h4></div>
            </a>`).join('');
    }
}

function setupAuthUI(topic) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userWidget = document.getElementById('userWidget');

    if (token) {
        // ── Update sidebar user widget with logged-in user info ──
        const email = localStorage.getItem('userEmail') || '';
        const firstName = localStorage.getItem('firstName') || '';
        const lastName = localStorage.getItem('lastName') || '';
        const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || email.split('@')[0] || 'User');
        const initial = (firstName?.[0] || email?.[0] || 'U').toUpperCase();

        if (userWidget) {
            userWidget.innerHTML = `
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center mb-3 shadow-lg">
                        <span class="text-2xl font-bold text-white">${initial}</span>
                    </div>
                    <h3 class="font-bold text-gray-900 dark:text-white">${displayName}</h3>
                    <p class="text-xs text-gray-500 mb-4 truncate">${email}</p>
                    <div class="flex gap-2">
                        <a href="profile.html" class="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-200 dark:hover:bg-white/20 transition-all text-center">
                            Profile
                        </a>
                        <a href="my-applications.html" class="flex-1 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs shadow-lg hover:shadow-xl transition-all text-center">
                            My Apps
                        </a>
                    </div>
                </div>
            `;
        }

        // ── Update create post avatar ──
        const avatarEl = document.getElementById('currentUserAvatar');
        if (avatarEl) {
            avatarEl.innerHTML = initial;
            avatarEl.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-lg font-bold text-white';
        }

        document.getElementById('createPostContainer').classList.remove('hidden');
        const submitBtn = document.getElementById('submitPostBtn');
        if (submitBtn) {
            submitBtn.onclick = async () => {
                console.log('Post button clicked');
                const contentInput = document.getElementById('postContent');
                const content = contentInput.value.trim();
                if (!content) {
                    console.log('Post content empty');
                    return;
                }

                // Basic title extraction (first 50 chars) if title is needed by backend but UI only has content
                const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
                console.log(`Checking for duplicates in topic: ${topic}`);

                // Disable button to prevent double submission
                submitBtn.disabled = true;
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="material-symbols-rounded animate-spin">refresh</span> Checking...';

                try {
                    // Step 1: Check for duplicate posts using AI
                    const duplicateCheckResponse = await fetch(`${API_BASE_URL}/forum/check-duplicate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, content, category: topic })
                    });

                    const duplicateResult = await duplicateCheckResponse.json();

                    // Step 2: If duplicates found, show warning modal
                    if (duplicateResult.success && duplicateResult.isDuplicate && duplicateResult.similarQuestions.length > 0) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;

                        // Show duplicate warning and wait for user decision
                        const userDecision = await showDuplicateWarningModal(duplicateResult.similarQuestions, topic);

                        if (userDecision === 'view') {
                            // User chose to view existing discussion - navigate to first match
                            const firstMatch = duplicateResult.similarQuestions[0];
                            window.location.href = `question-discussion.html?id=${firstMatch.id}&topic=${topic}`;
                            return;
                        } else if (userDecision === 'cancel') {
                            // User cancelled
                            return;
                        }
                        // If userDecision === 'post', continue with posting below
                    }

                    // Step 3: Post the question (either no duplicates or user chose to post anyway)
                    submitBtn.innerHTML = '<span class="material-symbols-rounded animate-spin">refresh</span> Posting...';

                    console.log(`Sending post to: ${API_BASE_URL}/explore/hub/${topic}/forum`);
                    const response = await authFetch(`${API_BASE_URL}/explore/hub/${topic}/forum`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, content })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        contentInput.value = '';
                        showToast('Post created successfully!');

                        // Prepend new post to the feed
                        const container = document.getElementById('postsContainer');
                        const newPostHTML = createPostHTML(result.data);

                        // Only clear if the container shows the "No discussions yet" empty state
                        const emptyState = container.querySelector(':scope > .glass-panel.text-center');
                        if (emptyState && container.children.length === 1) {
                            container.innerHTML = newPostHTML;
                        } else {
                            container.insertAdjacentHTML('afterbegin', newPostHTML);
                        }

                        scrollToPost(result.data.id);
                    } else if (response.status === 401) {
                        showToast('Session expired. Please login again.', 'error');
                        setTimeout(() => window.location.href = 'login.html', 2000);
                    } else {
                        const errorText = await response.text();
                        console.error('Post creation failed:', response.status, response.statusText, errorText);
                        showToast(`Failed to create post: ${response.statusText}`, 'error');
                    }
                } catch (e) {
                    console.error('Post creation error:', e);
                    showToast('Failed to create post. See console for details.', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            };
        } else {
            console.error('submitPostBtn not found');
        }
    }
}

// --- Duplicate Detection Modal ---

function showDuplicateWarningModal(similarQuestions, topic) {
    return new Promise((resolve) => {
        // Remove any existing modal
        const existing = document.getElementById('duplicateModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'duplicateModal';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';

        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in border border-gray-200 dark:border-gray-700">
                <!-- Header -->
                <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-rounded text-3xl">warning</span>
                        </div>
                        <div class="flex-grow">
                            <h2 class="text-2xl font-display font-bold mb-2">Similar Questions Found!</h2>
                            <p class="text-white/90 text-sm">We found ${similarQuestions.length} similar question${similarQuestions.length > 1 ? 's' : ''} that might already have answers. Would you like to check them first?</p>
                        </div>
                    </div>
                </div>

                <!-- Similar Questions List -->
                <div class="p-6 max-h-[400px] overflow-y-auto">
                    <div class="space-y-3">
                        ${similarQuestions.slice(0, 5).map((q, index) => `
                            <div class="group p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all cursor-pointer"
                                 onclick="document.getElementById('duplicateModal').dataset.selectedId='${q.id}';">
                                <div class="flex items-start gap-3">
                                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                                        ${index + 1}
                                    </div>
                                    <div class="flex-grow">
                                        <h3 class="font-bold text-gray-900 dark:text-white text-base mb-1 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors">
                                            ${q.title}
                                        </h3>
                                        <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-rounded text-sm">analytics</span>
                                                ${Math.round(q.similarity * 100)}% similar
                                            </span>
                                        </div>
                                        <p class="text-xs text-gray-600 dark:text-gray-300 italic">${q.reason}</p>
                                    </div>
                                    <span class="material-symbols-rounded text-gray-400 group-hover:text-yellow-500 transition-colors">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Actions -->
                <div class="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button id="viewExistingBtn" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-rounded text-lg">visibility</span>
                            View Top Match
                        </button>
                        <button id="postAnywayBtn" 
                                class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-rounded text-lg">send</span>
                            Post Anyway
                        </button>
                        <button id="cancelBtn" 
                                class="px-6 py-3 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                            Cancel
                        </button>
                    </div>
                    <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                        💡 Tip: Checking existing discussions helps avoid duplicate content
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('viewExistingBtn').onclick = () => {
            const selectedId = modal.dataset.selectedId || similarQuestions[0].id;
            modal.remove();
            resolve('view');
        };

        document.getElementById('postAnywayBtn').onclick = () => {
            modal.remove();
            resolve('post');
        };

        document.getElementById('cancelBtn').onclick = () => {
            modal.remove();
            resolve('cancel');
        };

        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve('cancel');
            }
        };

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
                resolve('cancel');
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// --- Utilities ---

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
}

function showToast(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white text-sm font-bold shadow-2xl z-50 animate-fade-in-up ${type === 'error' ? 'bg-red-500' : 'bg-gray-900 dark:bg-white dark:text-gray-900'}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function scrollToPost(id) {
    setTimeout(() => {
        const el = document.getElementById(`post-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-brand-500', 'ring-offset-4');
            setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-4'), 2000);
        }
    }, 1000);
}
