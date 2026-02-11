const API_BASE_URL = 'http://localhost:3000/community';
const AUTH_TOKEN_KEY = 'accessToken'; // Matching auth.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';
    const postId = urlParams.get('post');

    loadHubData(topic).then(() => {
        if (postId) {
            setTimeout(() => {
                const element = document.getElementById(`post-${postId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-primary', 'ring-offset-4');
                    toggleComments(postId);
                }
            }, 500);
        }
    });

    checkAuthAndSetupUI(topic);
    // These will now be handled inside loadHubData for better speed/coordination
    // but we can also keep them as fallback or separate if we prefer.
    // For now, let's move to the unified API.
});

async function loadHubData(topic) {
    try {
        const response = await fetch(`http://localhost:3000/community/explore/hub/${topic}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            updateTopicHeaderFromData(data.hub);
            updateMentorPostFromData(data.featuredMentorPost, data.hub);

            // Populate widgets with data from API
            displayTopicMentors(data.mentors);
            displayTopicEvents(data.events);
            displayTopicResources(data.resources);
            displayPosts(data.forumPosts);
        } else {
            console.error('Failed to load hub data:', result.message);
            // Fallback to individual loads if hub data fails
            updateTopicHeader(topic);
            loadForumPosts(topic);
            loadTopicResources(topic);
            loadTopicEvents(topic);
            loadTopicMentors(topic);
        }
    } catch (error) {
        console.error('Error fetching hub data:', error);
        updateTopicHeader(topic);
        loadForumPosts(topic);
        loadTopicMentors(topic);
    }
}

function updateTopicHeaderFromData(hub) {
    const topicTitle = document.getElementById('topicTitle');
    const topicBadge = document.getElementById('topicBadge');

    if (topicTitle) topicTitle.textContent = hub.title;
    if (topicBadge) topicBadge.textContent = hub.badge;
}

function updateMentorPostFromData(featuredPost, hub) {
    const questionEl = document.getElementById('mentorQuestion');
    const descEl = document.getElementById('mentorDescription');
    const adviceEl = document.getElementById('mentorAdvice');
    const mentorsEl = document.getElementById('activeMentors');

    if (questionEl) questionEl.textContent = featuredPost.question;
    if (descEl) descEl.textContent = featuredPost.description;
    if (adviceEl) adviceEl.textContent = featuredPost.advice;
    if (mentorsEl) mentorsEl.textContent = `${hub.stats.activeMentors} Active Mentors`;
}

function displayTopicMentors(mentors) {
    const list = document.getElementById('mentorsList');
    const widget = document.getElementById('topicMentorsWidget');
    if (!list || !widget) return;

    if (mentors && mentors.length > 0) {
        widget.classList.remove('hidden');
        list.innerHTML = mentors.map(mentor => `
            <div class="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-xl transition-colors">
                <img src="${mentor.image || 'assets/img/avatar_1.png'}" class="w-10 h-10 rounded-full object-cover">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">${mentor.name}</h4>
                    <p class="text-xs text-gray-500 truncate">${mentor.degree} @ ${mentor.university}</p>
                </div>
                <button class="p-2 rounded-full hover:bg-indigo-50 text-indigo-500"><span class="material-symbols-outlined text-lg">calendar_add_on</span></button>
            </div>
        `).join('');
    } else {
        widget.classList.add('hidden');
    }
}

function displayTopicEvents(events) {
    const list = document.getElementById('eventsList');
    const widget = document.getElementById('topicEventsWidget');
    if (!list || !widget) return;

    if (events && events.length > 0) {
        widget.classList.remove('hidden');
        list.innerHTML = events.map(event => `
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
    } else {
        widget.classList.add('hidden');
    }
}

function displayTopicResources(resources) {
    const list = document.getElementById('resourcesList');
    const widget = document.getElementById('topicResourcesWidget');
    if (!list || !widget) return;

    if (resources && resources.length > 0) {
        widget.classList.remove('hidden');
        list.innerHTML = resources.map(res => `
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
    } else {
        widget.classList.add('hidden');
    }
}


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
        <div class="glass-card p-8 rounded-3xl group mb-6 transition-all hover:shadow-2xl hover:shadow-primary/5" id="post-${post.id}">
            <div class="flex items-start justify-between mb-6">
                <div class="flex gap-4">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase border border-primary/20 shadow-inner">
                        ${post.author.firstName?.[0] || 'U'}
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-gray-900 dark:text-white">${post.author.firstName} ${post.author.lastName || ''}</h4>
                            ${post.isMentorOnly ? '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[8px] font-bold uppercase tracking-wider">Ask Mentor</span>' : ''}
                        </div>
                        <p class="text-xs text-gray-500">
                            <span class="post-time">${getTimeAgo(post.createdAt)}</span> • 
                            <span class="capitalize text-primary/70 font-medium">${post.author.role || 'Member'}</span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-1 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                    <span class="material-symbols-outlined text-sm text-gray-400">visibility</span>
                    <span class="text-[10px] font-bold text-gray-500">${post.views || 0} Views</span>
                </div>
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-sans text-sm md:text-base">
                ${post.content}
            </p>
            <div class="flex items-center gap-4 md:gap-8 pt-6 border-t border-gray-100 dark:border-white/5">
                <button onclick="likePost('${post.id}')" id="like-btn-${post.id}"
                        class="flex items-center gap-2 text-xs font-bold ${post.likes > 0 ? 'text-pink-500 shadow-pink-500/20' : 'text-gray-500'} hover:text-pink-500 transition-all active:scale-90">
                    <span class="material-symbols-outlined text-lg ${post.likes > 0 ? 'fill-current' : ''}">favorite</span> 
                    <span id="like-count-${post.id}">${post.likes || 0}</span> Likes
                </button>
                <button onclick="toggleComments('${post.id}')"
                        class="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-all active:scale-95 group/btn">
                    <span class="material-symbols-outlined text-lg group-hover/btn:rotate-12 transition-transform">chat_bubble</span> 
                    ${post.commentCount || 0} Comments
                </button>
                <button onclick="replyToPost('${post.id}', '${post.author.firstName}')"
                        class="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-500 transition-all active:scale-95">
                    <span class="material-symbols-outlined text-lg">reply</span> Reply
                </button>
                <button onclick="sharePost('${post.id}')"
                        class="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-green-500 transition-all active:scale-95">
                    <span class="material-symbols-outlined text-lg">share</span> Share
                </button>
            </div>

            <!-- Inline Comments Section -->
            <div id="comments-${post.id}" class="hidden mt-6 pt-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 rounded-[1.5rem] p-6">
                <div class="comments-list space-y-6 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <!-- Comments loaded here -->
                    <div class="text-center py-4">
                        <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                </div>
                
                ${isLoggedIn ? `
                <div class="flex gap-3 items-end">
                    <div class="flex-1">
                        <textarea id="input-${post.id}" placeholder="Write a thoughtful comment..." 
                            class="w-full bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] max-h-[120px] transition-all"
                            oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'"></textarea>
                    </div>
                    <button onclick="submitComment('${post.id}')" id="send-btn-${post.id}"
                        class="w-11 h-11 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90">
                        <span class="material-symbols-outlined text-xl">send</span>
                    </button>
                </div>
                ` : `
                <div class="text-center py-4 px-6 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <p class="text-xs text-gray-500">
                        <a href="login.html" class="text-primary font-bold hover:underline">Login</a> to join the discussion and share your thoughts.
                    </p>
                </div>
                `}
            </div>
        </div>
    `).join('');
}

function replyToPost(postId, authorName) {
    const section = document.getElementById(`comments-${postId}`);
    if (section.classList.contains('hidden')) {
        toggleComments(postId);
    }

    const input = document.getElementById(`input-${postId}`);
    if (input) {
        input.value = `@${authorName} `;
        input.focus();
        // Scroll to input
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) showToast('Please login to reply', 'error');
    }
}

function replyToComment(postId, authorName) {
    // Same logic as replyToPost but specifically for comments
    replyToPost(postId, authorName);
}


async function sharePost(postId) {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Check out this discussion on LoanHero',
                url: url
            });
        } catch (err) {
            copyToClipboard(url);
        }
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!');
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-sm font-bold shadow-2xl transition-all opacity-0 translate-y-4 flex items-center gap-2 ${type === 'success' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-red-500 text-white'
        }`;
    toast.innerHTML = `
        <span class="material-symbols-outlined text-base">${type === 'success' ? 'check_circle' : 'error'}</span>
        ${message}
    `;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
                list.innerHTML = comments.map(c => {
                    // Highlight @mentions in comments
                    const highlightedContent = c.content.replace(/(@\w+)/g, '<span class="text-primary font-bold">$1</span>');

                    return `
                    <div class="flex gap-4 group/comment animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 border border-white dark:border-white/5 shadow-sm shrink-0">
                            ${c.author?.firstName?.[0] || 'U'}
                        </div>
                        <div class="flex-1">
                            <div class="bg-white dark:bg-white/5 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 shadow-sm group-hover/comment:shadow-md transition-all">
                                <div class="flex items-center justify-between mb-1.5">
                                    <p class="text-xs font-bold text-gray-900 dark:text-white">${c.author?.firstName || 'User'} ${c.author?.lastName || ''}</p>
                                    <span class="text-[10px] text-gray-400 font-medium">${getTimeAgo(c.createdAt)}</span>
                                </div>
                                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${highlightedContent}</p>
                            </div>
                            <div class="flex items-center gap-4 mt-2 ml-1">
                                <button onclick="replyToComment('${postId}', '${c.author?.firstName}')" class="text-[10px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">reply</span> Reply
                                </button>
                                <button class="text-[10px] font-bold text-gray-500 hover:text-pink-500 transition-colors flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">favorite</span> Like
                                </button>
                            </div>
                        </div>
                    </div>
                `}).join('');
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
    if (!token) return showToast('Please login to comment', 'error');

    const btn = document.getElementById(`send-btn-${postId}`);
    btn.disabled = true;
    btn.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>';

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
            input.style.height = '44px';
            await loadComments(postId); // Reload comments
            showToast('Comment posted!');

            // Increment comment count in UI
            const commentBtn = document.querySelector(`#post-${postId} button[onclick*="toggleComments"]`);
            if (commentBtn) {
                const parts = commentBtn.innerText.trim().split(' ');
                const count = parseInt(parts[0]) + 1;
                commentBtn.innerHTML = `<span class="material-symbols-outlined text-lg group-hover/btn:rotate-12 transition-transform">chat_bubble</span> ${count} Comments`;
            }
        } else {
            showToast(result.message || 'Failed to post comment', 'error');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        showToast('Connection error', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-xl">send</span>';
    }
}

async function likePost(postId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return showToast('Please login to like posts.', 'error');

    const btn = document.getElementById(`like-btn-${postId}`);
    const countEl = document.getElementById(`like-count-${postId}`);
    const icon = btn.querySelector('.material-symbols-outlined');

    // Optimistic UI update
    const alreadyLiked = btn.classList.contains('text-pink-500');
    if (alreadyLiked) return; // Backend only does increment for now

    try {
        const response = await fetch(`${API_BASE_URL}/forum/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                countEl.textContent = result.likes;
                btn.classList.add('text-pink-500');
                icon.classList.add('fill-current');

                // Pop animation
                btn.style.transform = "scale(1.3)";
                setTimeout(() => btn.style.transform = "scale(1)", 200);
            }
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
