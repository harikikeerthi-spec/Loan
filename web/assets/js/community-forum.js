const API_BASE_URL = 'http://localhost:3000/community';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';

    updateTopicHeader(topic);
    loadForumPosts(topic);
    loadTopicResources(topic);
    loadTopicEvents(topic);
    loadTopicMentors(topic);

    // Setup post button
    const postBtn = document.querySelector('button.bg-primary.text-white');
    if (postBtn && postBtn.textContent === 'Post') {
        postBtn.addEventListener('click', () => createPost(topic));
    }
});

function updateTopicHeader(topic) {
    const topicTitle = document.getElementById('topicTitle');
    const topicBadge = document.getElementById('topicBadge');

    if (topicTitle) {
        // Simple mapping or capitalize
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
        // Show loading state (or keep skeleton)
        // postsContainer.innerHTML = '<div class="text-center py-12">Loading discussions...</div>';

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/forum?category=${topic}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            displayPosts(result.data);
        } else {
            // If no API posts, maybe keep default/sample ones or show empty message?
            // For now, let's prepend API posts to sample ones or replace them.
            // Replacing is better for real app.
            postsContainer.innerHTML = `
                <div class="glass-card p-8 rounded-3xl text-center">
                    <p class="text-gray-500">No discussions yet in this topic. Be the first to start one!</p>
                </div>
             `;
        }
    } catch (error) {
        console.error('Error loading forum posts:', error);
    }
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    postsContainer.innerHTML = posts.map(post => `
        <div class="glass-card p-8 rounded-3xl group">
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
                <!-- Options menu could go here -->
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-sans">
                ${post.content}
            </p>
            <div class="flex items-center gap-6 pt-6 border-t border-gray-100 dark:border-white/5">
                <button onclick="likePost('${post.id}')" 
                        class="flex items-center gap-2 text-sm font-bold ${post.likes > 0 ? 'text-primary' : 'text-gray-500'} hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-lg">arrow_upward</span> ${post.likes} Likes
                </button>
                <button onclick="window.location.href='forum-post.html?id=${post.id}'"
                        class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-lg">chat_bubble</span> ${post.commentCount || 0} Comments
                </button>
                <button class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-lg">share</span> Share
                </button>
            </div>
        </div>
    `).join('');
}

async function createPost(topic) {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) return alert('Please write something first.');

    const token = localStorage.getItem('token');
    if (!token) return alert('Please login to post.');

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
                title: 'Discussion' // Optional, simplified for now
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
        alert('Failed to create post');
    }
}

async function likePost(postId) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please login to like posts.');

    try {
        const response = await fetch(`${API_BASE_URL}/forum/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Reload just to refresh specific post ideally, but full reload for simplicity
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
    } catch (error) {
        console.error('Error loading resources:', error);
    }
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
                    <button class="w-full mt-2 py-2 rounded-xl bg-orange-500/10 text-orange-600 text-xs font-bold uppercase hover:bg-orange-500 hover:text-white transition-all">
                        Register
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
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
                    <button class="p-2 rounded-full hover:bg-indigo-50 text-indigo-500">
                        <span class="material-symbols-outlined text-lg">calendar_add_on</span>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading mentors:', error);
    }
}
