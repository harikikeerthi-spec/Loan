const API_BASE_URL = 'http://localhost:3000/community';
const AUTH_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Get question ID from URL
const urlParams = new URLSearchParams(window.location.search);
const questionId = urlParams.get('id');
const hubTopic = urlParams.get('topic') || 'general';

// Auto-refresh wrapper
async function authFetch(url, options = {}) {
    let token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(url, options);

    if (response.status === 401) {
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
    if (!questionId) {
        showToast('Invalid question ID', 'error');
        setTimeout(() => window.location.href = 'engage.html', 2000);
        return;
    }
    initializeDiscussion();
});

async function initializeDiscussion() {
    try {
        await loadQuestion();
        setupAuthUI();
        await loadRelatedQuestions();
    } catch (error) {
        console.error('Initialization failed:', error);
        showToast('Failed to load question discussion', 'error');
    }
}

async function loadQuestion() {
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${API_BASE_URL}/forum/${questionId}`, { headers });
        const result = await response.json();

        if (result.success && result.data) {
            renderQuestion(result.data);
            renderAnswers(result.data.comments || []);
        } else {
            throw new Error('Failed to load question');
        }
    } catch (error) {
        console.error('Error loading question:', error);
        document.getElementById('questionCard').innerHTML = `
            <div class="text-center text-red-500 p-8">
                <span class="material-symbols-rounded text-6xl mb-4">error</span>
                <p class="text-xl font-bold">Failed to load question</p>
                <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-brand-500 text-white rounded-full font-bold">
                    Retry
                </button>
            </div>
        `;
    }
}

function renderQuestion(question) {
    const userInitials = question.author?.firstName ? question.author.firstName[0] : 'U';
    const timeAgo = getTimeAgo(question.createdAt);
    const likes = question.likes || 0;
    const commentCount = question.commentCount || 0;

    const questionCard = document.getElementById('questionCard');
    questionCard.innerHTML = `
        <div class="flex items-start gap-6 mb-6">
            <div class="flex-shrink-0">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/50 dark:to-accent-900/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-2xl shadow-inner">
                    ${userInitials}
                </div>
            </div>
            <div class="flex-grow">
                <div class="flex items-center gap-3 mb-2">
                    <h4 class="font-bold text-lg text-gray-900 dark:text-white">
                        ${question.author?.firstName || 'User'} ${question.author?.lastName || ''}
                    </h4>
                    ${question.author?.role === 'admin' ? '<span class="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase">Admin</span>' : ''}
                    ${question.author?.role === 'mentor' ? '<span class="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold uppercase">Mentor</span>' : ''}
                    <span class="text-sm text-gray-500">• ${timeAgo}</span>
                </div>
                <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    ${question.title || 'Discussion'}
                </h1>
                <div class="prose dark:prose-invert max-w-none mb-6">
                    <p class="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">${question.content}</p>
                </div>
                
                <!-- Tags -->
                ${question.tags && question.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${question.tags.map(tag => `
                            <span class="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Actions -->
                <div class="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-white/10">
                    <button data-action="like-post" data-id="${question.id}" class="flex items-center gap-2 text-sm font-bold ${question.liked ? 'text-pink-500' : 'text-gray-500'} hover:text-pink-500 transition-colors">
                        <span class="material-symbols-rounded ${question.liked ? 'fill-current' : ''}">favorite</span>
                        <span class="likes-count">${likes}</span>
                    </button>
                    <div class="flex items-center gap-2 text-sm font-bold text-gray-500">
                        <span class="material-symbols-rounded">chat_bubble</span>
                        <span>${commentCount}</span> Answers
                    </div>
                    <button data-action="share-post" data-id="${question.id}" class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">
                        <span class="material-symbols-rounded">share</span>
                        Share
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    questionCard.addEventListener('click', handleQuestionActions);
}

async function handleQuestionActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'like-post') await handleLikePost(id, btn);
    if (action === 'share-post') handleSharePost(id);
}

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
        }
    } catch (e) {
        showToast('Error liking post', 'error');
    } finally {
        btn.disabled = false;
    }
}

function handleSharePost(postId) {
    const shareUrl = `${window.location.origin}/question-discussion.html?id=${postId}&topic=${hubTopic}`;
    try {
        navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy link', 'error');
    }
}

function renderAnswers(answers) {
    const answersList = document.getElementById('answersList');

    if (!answers || answers.length === 0) {
        answersList.innerHTML = `
            <div class="glass-panel p-12 text-center rounded-3xl">
                <div class="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-rounded text-3xl text-gray-400">chat_bubble</span>
                </div>
                <h3 class="text-xl font-bold mb-2">No answers yet</h3>
                <p class="text-gray-500">Be the first to answer this question!</p>
            </div>
        `;
        return;
    }

    answersList.innerHTML = answers.map(answer => createAnswerHTML(answer)).join('');
    answersList.addEventListener('click', handleAnswerActions);
}

function createAnswerHTML(answer, isReply = false) {
    const repliesHTML = answer.replies && answer.replies.length > 0
        ? `<div class="ml-10 pl-4 border-l-2 border-gray-100 dark:border-white/5 space-y-4 mt-4">
             ${answer.replies.map(r => createAnswerHTML(r, true)).join('')}
           </div>`
        : '';

    // Check if current user can delete this comment
    const currentUserId = localStorage.getItem('userId');
    const currentUserRole = localStorage.getItem('userRole');
    const canDelete = (answer.authorId === currentUserId) || (currentUserRole === 'admin');

    return `
        <div class="glass-panel p-6 rounded-3xl animate-fade-in-up ${isReply ? 'ml-4' : ''}">
            <div class="flex gap-4">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/50 dark:to-accent-900/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg shadow-inner">
                        ${answer.author?.firstName?.[0] || 'U'}
                    </div>
                </div>
                <div class="flex-grow">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-gray-900 dark:text-white">${answer.author?.firstName || 'User'}</span>
                            ${answer.author?.role === 'admin' ? '<span class="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase">Admin</span>' : ''}
                            ${answer.author?.role === 'mentor' ? '<span class="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold uppercase">Mentor</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-500">${getTimeAgo(answer.createdAt)}</span>
                            ${canDelete ? `
                                <button data-action="delete-comment" data-id="${answer.id}" 
                                        class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete Comment">
                                    <span class="material-symbols-rounded text-base">delete</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">${answer.content}</p>
                    
                    <div class="flex items-center gap-4">
                        <button data-action="like-comment" data-id="${answer.id}" class="text-xs font-bold ${answer.liked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500 flex items-center gap-1">
                            <span class="material-symbols-rounded text-sm ${answer.liked ? 'fill-current' : ''}">favorite</span>
                            <span class="likes-count">${answer.likes || 0}</span>
                        </button>
                        <button data-action="reply-to-comment" data-id="${answer.id}" class="text-xs font-bold text-gray-400 hover:text-brand-500">Reply</button>
                    </div>

                    <!-- Reply Input -->
                    <div id="reply-input-${answer.id}" class="hidden mt-4 flex gap-3 animate-fade-in-up">
                        <textarea placeholder="Write a reply..." class="flex-grow bg-gray-50 dark:bg-white/5 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 resize-none h-[80px]"></textarea>
                        <button data-action="submit-comment" data-id="${questionId}" data-parentid="${answer.id}" class="p-2 bg-brand-500 text-white rounded-lg shadow-md hover:bg-brand-600 self-end">
                            <span class="material-symbols-rounded text-lg block">send</span>
                        </button>
                    </div>
                </div>
            </div>
            ${repliesHTML}
        </div>
    `;
}

async function handleAnswerActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const parentId = btn.dataset.parentid;

    if (action === 'like-comment') await handleLikeComment(id, btn);
    if (action === 'reply-to-comment') showReplyInput(id);
    if (action === 'submit-comment') await submitComment(id, parentId, btn);
    if (action === 'delete-comment') await handleDeleteComment(id);
}

async function handleLikeComment(commentId, btn) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return showToast('Please login to like', 'info');

    const countEl = btn.querySelector('.likes-count');
    const icon = btn.querySelector('.material-symbols-rounded');
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
                icon.classList.add('fill-current');
            } else {
                btn.classList.remove('text-pink-500');
                btn.classList.add('text-gray-400');
                icon.classList.remove('fill-current');
            }
        }
    } catch (e) {
        showToast('Error liking comment', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function handleDeleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/forum/comments/${commentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Comment deleted successfully');
            await loadQuestion(); // Reload to update the page
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else if (response.status === 403) {
            showToast('You do not have permission to delete this comment', 'error');
        } else {
            showToast('Failed to delete comment', 'error');
        }
    } catch (e) {
        console.error('Delete error:', e);
        showToast('Error deleting comment', 'error');
    }
}

function showReplyInput(commentId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        showToast('Please login to reply', 'info');
        return;
    }

    const inputDiv = document.getElementById(`reply-input-${commentId}`);
    if (inputDiv) {
        inputDiv.classList.toggle('hidden');
        if (!inputDiv.classList.contains('hidden')) {
            inputDiv.querySelector('textarea').focus();
        }
    }
}

async function submitComment(postId, parentId, btn) {
    let textarea;
    if (parentId) {
        textarea = document.getElementById(`reply-input-${parentId}`).querySelector('textarea');
    } else {
        textarea = document.getElementById('answerContent');
    }

    const content = textarea.value.trim();
    if (!content) return;

    btn.disabled = true;

    try {
        const body = { content };
        if (parentId) body.parentId = parentId;

        const response = await authFetch(`${API_BASE_URL}/forum/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            textarea.value = '';
            if (parentId) document.getElementById(`reply-input-${parentId}`).classList.add('hidden');

            showToast('Reply posted!', 'success');
            await loadQuestion(); // Reload to show new comment
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            showToast('Failed to post reply', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Failed to post reply', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function loadRelatedQuestions() {
    try {
        const response = await fetch(`${API_BASE_URL}/forum?category=${hubTopic}&limit=5`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const filtered = result.data.filter(q => q.id !== questionId).slice(0, 3);
            if (filtered.length > 0) {
                renderRelatedQuestions(filtered);
            }
        }
    } catch (e) {
        console.error('Error loading related questions:', e);
    }
}

function renderRelatedQuestions(questions) {
    const container = document.getElementById('relatedQuestions');
    const list = document.getElementById('relatedQuestionsList');

    list.innerHTML = questions.map(q => `
        <a href="question-discussion.html?id=${q.id}&topic=${hubTopic}" 
           class="block glass-panel p-4 rounded-2xl hover:shadow-lg transition-all">
            <h4 class="font-bold text-gray-900 dark:text-white mb-1">${q.title || 'Discussion'}</h4>
            <p class="text-xs text-gray-500">${q.commentCount || 0} answers • ${getTimeAgo(q.createdAt)}</p>
        </a>
    `).join('');

    container.classList.remove('hidden');
}

function setupAuthUI() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const answerInput = document.getElementById('answerInput');
    const loginPrompt = document.getElementById('loginPrompt');
    const submitBtn = document.getElementById('submitAnswerBtn');

    if (token) {
        const firstName = localStorage.getItem('firstName') || '';
        const email = localStorage.getItem('userEmail') || '';
        const initial = (firstName?.[0] || email?.[0] || 'U').toUpperCase();

        const avatarEl = document.getElementById('currentUserAvatar');
        if (avatarEl) {
            avatarEl.textContent = initial;
        }

        answerInput.classList.remove('hidden');

        if (submitBtn) {
            submitBtn.onclick = async () => {
                await submitComment(questionId, null, submitBtn);
            };
        }
    } else {
        loginPrompt.classList.remove('hidden');
    }
}

// Utilities
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
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function showToast(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white text-sm font-bold shadow-2xl z-50 animate-fade-in-up ${type === 'error' ? 'bg-red-500' : 'bg-gray-900 dark:bg-white dark:text-gray-900'}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
