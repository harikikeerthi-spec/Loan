const API_BASE_URL = 'http://localhost:3000/community';
const AUTH_TOKEN_KEY = 'accessToken'; // Matching auth.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';

    updateTopicHeader(topic);
    checkAuthAndSetupUI(topic);
    loadForumPosts(topic);
    loadTopicResources(topic);
    loadTopicEvents(topic);
    loadTopicMentors(topic);
});

function checkAuthAndSetupUI(topic) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const createContainer = document.getElementById('createPostContainer');
    const loginMsg = document.getElementById('loginToPostMsg');
    const submitBtn = document.getElementById('submitPostBtn');

    if (token) {
        if (createContainer) createContainer.classList.remove('hidden');
        if (loginMsg) loginMsg.classList.add('hidden');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => createPost(topic));
        }
    } else {
        if (createContainer) createContainer.classList.add('hidden');
        if (loginMsg) loginMsg.classList.remove('hidden');
    }
}

function updateTopicHeader(topic) {
    const topicTitle = document.getElementById('topicTitle');
    const topicBadge = document.getElementById('topicBadge');

    if (topicTitle) {
        const displayNames = {
            'loan': 'Loans & Finance',
            'eligibility': 'Loans & Eligibility',
            'universities': 'Universities & Rankings',
            'courses': 'Courses & Programs',
            'visa': 'Visa & Immigration',
            'scholarships': 'Scholarships & Grants',
            'accommodation': 'Accommodation & Living',
            'gre': 'Test Prep (GRE/GMAT)',
            'general': 'General Discussion'
        };
        topicTitle.textContent = displayNames[topic] || topic.replace(/-/g, ' ');
    }

    if (topicBadge) {
        topicBadge.textContent = topic.toUpperCase();
    }
}

async function loadForumPosts(topic) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/forum?category=${topic}&limit=10`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            displayPosts(result.data);
        } else {
            postsContainer.innerHTML = `
                <div class="glass-card p-8 rounded-3xl text-center">
                    <p class="text-gray-500">No discussions yet in this topic. Be the first to start one!</p>
                </div>
             `;
        }
    } catch (error) {
        console.error('Error loading forum posts:', error);
        postsContainer.innerHTML = '<div class="text-center text-red-500">Failed to load posts.</div>';
    }
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    const isLoggedIn = !!localStorage.getItem(AUTH_TOKEN_KEY);

    postsContainer.innerHTML = posts.map(post => `
        <div class="glass-card p-8 rounded-3xl group mb-6">
            <div class="flex items-start justify-between mb-6">
                <div class="flex gap-4">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                        ${post.author.firstName?.[0] || 'U'}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-white">${post.author.firstName} ${post.author.lastName || ''}</h4>
                        <p class="text-xs text-gray-500">
                            <span class="post-time">${getTimeAgo(post.createdAt)}</span> • 
                            <span class="capitalize">${post.author.role || 'Member'}</span>
                        </p>
                    </div>
                </div>
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-sans">
                ${post.content}
            </p>
            <div class="flex items-center gap-6 pt-6 border-t border-gray-100 dark:border-white/5">
                <button onclick="likePost('${post.id}')" 
                        class="flex items-center gap-2 text-sm font-bold ${post.likes > 0 ? 'text-primary' : 'text-gray-500'} hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-lg">favorite</span> ${post.likes || 0} Likes
                </button>
                <button onclick="toggleComments('${post.id}')"
                        class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-lg">chat_bubble</span> ${post.commentCount || 0} Comments
                </button>
                <button class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-lg">share</span> Share
                </button>
            </div>

            <!-- Inline Comments Section -->
            <div id="comments-${post.id}" class="hidden mt-6 pt-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 rounded-xl p-4">
                <div class="comments-list space-y-4 mb-4">
                    <!-- Comments loaded here -->
                    <div class="text-center text-gray-500 text-xs">Loading comments...</div>
                </div>
                
                ${isLoggedIn ? `
                <div class="flex gap-2">
                    <input type="text" id="input-${post.id}" placeholder="Write a comment..." 
                        class="flex-1 bg-white dark:bg-black/20 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary">
                    <button onclick="submitComment('${post.id}')" 
                        class="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                        <span class="material-symbols-outlined text-sm">send</span>
                    </button>
                </div>
                ` : `
                <div class="text-center text-xs text-gray-500">
                    <a href="login.html" class="text-primary font-bold hover:underline">Login</a> to comment
                </div>
                `}
            </div>
        </div>
    `).join('');
}

async function createPost(topic) {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) return alert('Please write something first.');

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return alert('Please login to post.');

    const submitBtn = document.getElementById('submitPostBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/forum`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content,
                category: topic,
                title: 'Discussion'
            })
        });

        const result = await response.json();
        if (result.success) {
            textarea.value = '';
            loadForumPosts(topic); // Reload posts
        } else {
            alert(result.message || 'Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to connect to server');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (!section) return;

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        // Load comments logic
        await loadComments(postId);
    } else {
        section.classList.add('hidden');
    }
}

async function loadComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    const list = section.querySelector('.comments-list');

    try {
        // Assuming GET /forum/:id returns post with comments populated
        const response = await fetch(`${API_BASE_URL}/forum/${postId}`);
        const result = await response.json();

        if (result.success && result.data && result.data.comments) {
            const comments = result.data.comments;
            if (comments.length === 0) {
                list.innerHTML = '<div class="text-center text-gray-400 text-xs italic">No comments yet.</div>';
            } else {
                list.innerHTML = comments.map(c => `
                    <div class="flex gap-3">
                        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                            ${c.author?.firstName?.[0] || 'U'}
                        </div>
                        <div class="flex-1">
                            <div class="bg-white dark:bg-white/10 p-3 rounded-lg rounded-tl-none">
                                <p class="text-xs font-bold text-gray-900 dark:text-white mb-1">${c.author?.firstName || 'User'}</p>
                                <p class="text-sm text-gray-700 dark:text-gray-200">${c.content}</p>
                            </div>
                            <span class="text-[10px] text-gray-400 ml-2">${getTimeAgo(c.createdAt)}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        list.innerHTML = '<div class="text-red-500 text-xs">Error loading comments</div>';
    }
}

async function submitComment(postId) {
    const input = document.getElementById(`input-${postId}`);
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return alert('Please login to comment');

    try {
        const response = await fetch(`${API_BASE_URL}/forum/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        const result = await response.json();
        if (result.success) {
            input.value = '';
            loadComments(postId); // Reload comments

            // Update comment count UI optionally
            // const countBtn = document.querySelector(`button[onclick="toggleComments('${postId}')"]`);
            // if(countBtn) ...
        } else {
            alert(result.message || 'Failed to post comment');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
    }
}

async function likePost(postId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return alert('Please login to like posts.');

    try {
        const response = await fetch(`${API_BASE_URL}/forum/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Reload posts to update count (or update locally for better UX)
            const urlParams = new URLSearchParams(window.location.search);
            loadForumPosts(urlParams.get('topic') || 'general');
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}

// ... Resource loaders can remain same or be copied ...
async function loadTopicResources(topic) {
    const list = document.getElementById('resourcesList');
    const widget = document.getElementById('topicResourcesWidget');
    if (!list || !widget) return;
    try {
        const response = await fetch(`${API_BASE_URL}/resources?category=${topic}&limit=3`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            widget.classList.remove('hidden');
            list.innerHTML = result.data.map(res => `
                <div class="flex items-start gap-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-xl transition-colors">
                    <div class="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                        <span class="material-symbols-outlined text-xl">${res.type === 'video' ? 'play_circle' : 'description'}</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">${res.title}</h4>
                        <p class="text-xs text-gray-500 line-clamp-1">${res.description}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) { console.error(error); }
}

async function loadTopicEvents(topic) {
    const list = document.getElementById('eventsList');
    const widget = document.getElementById('topicEventsWidget');
    if (!list || !widget) return;
    try {
        const response = await fetch(`${API_BASE_URL}/events?category=${topic}&limit=2`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            widget.classList.remove('hidden');
            list.innerHTML = result.data.map(event => `
                <div class="glass-card p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 group">
                    <div class="flex justify-between items-start mb-2">
                        <div class="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">
                            ${new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <span class="text-xs font-bold text-gray-500">${event.time}</span>
                    </div>
                    <h4 class="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 transition-colors">${event.title}</h4>
                    <button class="w-full mt-2 py-2 rounded-xl bg-orange-500/10 text-orange-600 text-xs font-bold uppercase hover:bg-orange-500 hover:text-white transition-all">Register</button>
                </div>
            `).join('');
        }
    } catch (error) { console.error(error); }
}

async function loadTopicMentors(topic) {
    const list = document.getElementById('mentorsList');
    const widget = document.getElementById('topicMentorsWidget');
    if (!list || !widget) return;
    try {
        const response = await fetch(`${API_BASE_URL}/mentors?category=${topic}&limit=3`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            widget.classList.remove('hidden');
            list.innerHTML = result.data.map(mentor => `
                <div class="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-xl transition-colors">
                    <img src="${mentor.image || 'assets/img/avatar_1.png'}" class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-1">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">${mentor.name}</h4>
                        <p class="text-xs text-gray-500 truncate">${mentor.degree} @ ${mentor.university}</p>
                    </div>
                    <button class="p-2 rounded-full hover:bg-indigo-50 text-indigo-500"><span class="material-symbols-outlined text-lg">calendar_add_on</span></button>
                </div>
            `).join('');
        }
    } catch (error) { console.error(error); }
}
