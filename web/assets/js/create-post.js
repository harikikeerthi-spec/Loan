const API_BASE_URL = 'http://localhost:3000/api/community';
const AUTH_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// --- Auth Utils (Shared) ---
async function authFetch(url, options = {}) {
    let token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
            try {
                const refreshRes = await fetch('http://localhost:3000/api/auth/refresh', {
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

// --- Page Logic ---

// --- Page Logic ---

let currentStep = 1;
let postData = { title: '', category: 'General Discussion', content: '', excerpt: '' };
const topicMap = {
    'education-loan': 'Education Loan',
    'loan': 'Education Loan',
    'eligibility': 'Education Loan',
    'banks': 'Education Loan',
    'finance': 'Education Loan',

    'visa': 'Visa Process',
    'visa-process': 'Visa Process',
    'immigration': 'Visa Process',

    'admission': 'University Admission',
    'university-admission': 'University Admission',
    'universities': 'University Admission',
    'rankings': 'University Admission',

    'scholarships': 'Scholarships',
    'grants': 'Scholarships',
    'financial-aid': 'Scholarships',

    'courses': 'Courses & Majors',
    'programs': 'Courses & Majors',
    'majors': 'Courses & Majors',

    'test-prep': 'Test Prep (GRE/IELTS/TOEFL)',
    'gre': 'Test Prep (GRE/IELTS/TOEFL)',
    'ielts': 'Test Prep (GRE/IELTS/TOEFL)',
    'toefl': 'Test Prep (GRE/IELTS/TOEFL)',

    'accommodation': 'Housing & Accommodation',
    'housing': 'Housing & Accommodation',
    'living': 'Housing & Accommodation',

    'jobs': 'Part-time Jobs & Careers',
    'careers': 'Part-time Jobs & Careers',
    'internships': 'Part-time Jobs & Careers',
    'work': 'Part-time Jobs & Careers',

    'general': 'General Discussion',
    'study-abroad': 'General Discussion',
    'sop': 'General Discussion',
    'meetups': 'General Discussion'
};

// Map Display Name -> Backend Hub Slug (Canonical)
const categorySlugMap = {
    'Education Loan': 'eligibility',
    'Visa Process': 'visa',
    'University Admission': 'universities',
    'Scholarships': 'scholarships',
    'Courses & Majors': 'courses',
    'Test Prep (GRE/IELTS/TOEFL)': 'gre',
    'Housing & Accommodation': 'accommodation',
    'Part-time Jobs & Careers': 'jobs',
    'General Discussion': 'general'
};

// Icon & color map for each category (used for visual display)
const categoryMeta = {
    'Education Loan': { icon: 'account_balance_wallet', color: 'green', emoji: '💰' },
    'Visa Process': { icon: 'flight_takeoff', color: 'sky', emoji: '✈️' },
    'University Admission': { icon: 'school', color: 'blue', emoji: '🏛️' },
    'Scholarships': { icon: 'savings', color: 'teal', emoji: '🎓' },
    'General Discussion': { icon: 'forum', color: 'gray', emoji: '💬' },
    'Courses & Majors': { icon: 'menu_book', color: 'purple', emoji: '📚' },
    'Test Prep (GRE/IELTS/TOEFL)': { icon: 'quiz', color: 'cyan', emoji: '📝' },
    'Housing & Accommodation': { icon: 'home', color: 'rose', emoji: '🏠' },
    'Part-time Jobs & Careers': { icon: 'work', color: 'amber', emoji: '💼' }
};

// Moderation / tagging state
let moderationBlocked = false;
let moderationReason = '';

// ─── AI Moderation Keyword Lists ──────────────────────────────────────────────

// Topics that ARE allowed on this platform
const EDUCATION_KEYWORDS = [
    // Standalone & Common
    'education', 'study', 'studying', 'course', 'program', 'university', 'college', 'degree',
    // Loans & Finance
    'loan', 'loans', 'finance', 'student loan', 'education loan', 'emi', 'interest rate', 'bank', 'nbfc',
    'collateral', 'co-applicant', 'cosigner', 'sanction', 'disbursement', 'moratorium',
    'repayment', 'itr', 'form16', 'salary', 'income', 'credit score', 'cibil',
    'axis', 'sbi', 'hdfc', 'avanse', 'credila', 'incred', 'prodigy', 'mpower',
    'interest', 'processing fee', 'margin money', 'subsidy',
    // Education & Admissions
    'admission', 'admissions', 'scholarship', 'scholarships', 'masters', 'phd',
    'bachelors', 'mba', 'ms', 'btech', 'gpa', 'transcript', 'application', 'deadline',
    'acceptance', 'waitlist', 'enrollment', 'tuition', 'fees', 'grant', 'fellowship',
    'assistantship', 'stipend', 'funding', 'professor', 'advisor', 'campus',
    'admit', 'accepted', 'rejected', 'decision', 'offer letter', 'i20',
    // Study Abroad
    'abroad', 'international', 'studyabroad', 'usa', 'us', 'uk', 'canada', 'australia',
    'germany', 'ireland', 'europe', 'overseas', 'united kingdom', 'united states',
    'foreign', 'immigrant', 'student',
    // Visa & Immigration
    'visa', 'f1', 'f-1', 'immigration', 'sevis', 'ds160', 'ds-160', 'embassy', 'consulate',
    'opt', 'cpt', 'h1b', 'h-1b', 'resident', 'approve', 'approval', 'interview', 'slot',
    'biometric', 'passport', 'stamping', 'rejected', 'denial', 'days', 'processing',
    // Tests
    'gre', 'gmat', 'sat', 'toefl', 'ielts', 'pte', 'duolingo', 'sop', 'lor',
    'recommendation', 'eligibility', 'score', 'exam', 'test',
    // Career (academic context)
    'internship', 'placement', 'on campus', 'off campus', 'career', 'work permit',
    // Common question words in context
    'how long', 'how many', 'required', 'process', 'documents', 'requirements'
];

// Explicitly OFF-TOPIC categories — any match here causes instant rejection
const OFF_TOPIC_KEYWORDS = [
    // Food & Cooking
    'recipe', 'ingredient', 'ingredients', 'cook', 'cooking', 'biryani', 'pizza',
    'burger', 'pasta', 'noodles', 'food', 'dish', 'meal', 'restaurant', 'chef',
    'bake', 'fry', 'boil', 'spice', 'masala', 'curry', 'snack', 'breakfast',
    'lunch', 'dinner', 'kitchen', 'tomato', 'onion', 'garlic', 'rice', 'roti',
    'bread', 'soup', 'salad', 'dessert', 'cake', 'sweet', 'chocolate',
    // Entertainment
    'movie', 'film', 'actor', 'actress', 'celebrity', 'bollywood', 'hollywood',
    'song', 'music', 'album', 'concert', 'anime', 'manga', 'show', 'series',
    'netflix', 'youtube', 'tiktok', 'reel', 'streaming',
    // Sports
    'cricket', 'football', 'soccer', 'basketball', 'tennis', 'ipl', 'fifa',
    'match', 'tournament', 'wicket', 'athlete', 'olympic',
    // Politics & Religion
    'election', 'vote', 'politician', 'politics', 'religion', 'god', 'temple',
    'church', 'mosque', 'prayer', 'astrology', 'horoscope', 'zodiac',
    // Lifestyle
    'fitness', 'gym', 'workout', 'diet', 'weight loss', 'beauty', 'makeup',
    'skincare', 'fashion', 'dating', 'relationship', 'love', 'breakup',
    // Random / Trivial
    'joke', 'meme', 'funny', 'prank', 'gossip', 'rumour', 'pet', 'dog', 'cat',
    'animal', 'plant', 'garden', 'tourism', 'hotel', 'vacation', 'holiday',
    'shopping', 'discount', 'crypto', 'bitcoin', 'nft', 'gaming', 'game'
];

const BANNED_WORDS = [
    'bomb', 'attack', 'drugs', 'porn', 'sex', 'murder', 'kill', 'suicide',
    'weapon', 'terror', 'illegal', 'fraud', 'scam', 'hack', 'explosive', 'abuse'
];

const STOPWORDS = [
    'the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'were', 'will',
    'would', 'could', 'should', 'have', 'has', 'had', 'from', 'your', 'you',
    'a', 'an', 'in', 'on', 'of', 'to', 'is', 'it', 'as', 'by', 'be', 'or',
    'at', 'our', 'we', 'me', 'i', 'my', 'what', 'how', 'why', 'when', 'where',
    'who', 'which', 'do', 'get', 'make', 'give', 'tell', 'want', 'need', 'please'
];

// Lightweight text helpers + moderation/tag extraction
function normalizeText(s) {
    return (s || '').toLowerCase().replace(/[\W_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsBannedWords(text) {
    const t = normalizeText(text);
    return BANNED_WORDS.some(b => t.includes(b));
}

function isOffTopic(text) {
    const t = normalizeText(text);
    return OFF_TOPIC_KEYWORDS.some(k => t.includes(k));
}

function isTopical(text) {
    const t = normalizeText(text);
    const matches = EDUCATION_KEYWORDS.filter(k => t.includes(k));
    
    // High-signal keywords: if ANY of these appear, allow immediately
    const highSignalKeywords = [
        'visa', 'scholarship', 'loan', 'admission', 'masters', 'university',
        'college', 'gre', 'ielts', 'toefl', 'f1', 'i20', 'tuition', 'education',
        'mba', 'phd', 'abroad', 'embassy', 'consulate', 'opt', 'cpt', 'h1b'
    ];
    if (highSignalKeywords.some(k => t.includes(k))) return true;
    
    // Short/vague questions need 2 matching education keywords; longer ones need at least 1
    const wordCount = t.split(' ').filter(w => w.length > 2).length;
    const requiredMatches = wordCount < 6 ? 2 : 1;
    return matches.length >= requiredMatches;
}

function extractKeywords(text, limit = 6) {
    const t = normalizeText(text);
    const tokens = t.split(' ').filter(w => w.length > 2 && !STOPWORDS.includes(w));
    const freq = {};
    tokens.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
    return sorted.slice(0, limit);
}

function mapKeywordsToTags(words) {
    const mapped = new Set();
    words.forEach(w => {
        if (!w) return;
        if (w.match(/^(ielts|toefl|pte|gre|sop)$/)) mapped.add(w);
        else if (w.match(/^(loan|loans)$/)) mapped.add('loan');
        else if (w.match(/^(education|study|studying|studyabroad)$/)) mapped.add('education');
        else if (w.match(/^(visa|immigration)$/)) mapped.add('visa');
        else if (w.match(/^(scholarship|scholarships|grant)$/)) mapped.add('scholarship');
        else if (w.match(/^(admission|apply|application)$/)) mapped.add('admission');
        else if (w.match(/^(bank|banks)$/)) mapped.add('bank');
        else if (w.match(/^(salary|salary_slip|salaryslip)$/)) mapped.add('salary');
        else if (w.match(/^(itr|form16|tax)$/)) mapped.add('itr');
        else if (w.length <= 20) mapped.add(w);
    });
    return Array.from(mapped).slice(0, 6);
}

function generateTagsFromText(text) {
    // Fallback local tags based on title keywords
    const base = new Set(['education', 'loan']);
    const kws = extractKeywords(text, 8);
    const mapped = mapKeywordsToTags(kws);
    mapped.forEach(t => base.add(t));
    return Array.from(base).slice(0, 5);
}

function moderateContent(text) {
    // Returns { allowed: boolean, reason: string }
    const combined = normalizeText(text);

    // 1. Hard block: explicitly off-topic content (food, sports, etc.)
    if (isOffTopic(combined)) return { allowed: false, reason: 'off_topic' };

    // 2. Prohibited content: violence, profanity, etc.
    if (containsBannedWords(combined)) return { allowed: false, reason: 'prohibited_content' };

    // 3. Must relate to education / loans
    if (!isTopical(combined)) return { allowed: false, reason: 'off_topic' };

    return { allowed: true };
}

// Render tag suggestions (click to toggle)
function renderTagSuggestionsUI(tags) {
    const el = document.getElementById('suggestedTagsList');
    if (!el) return;
    const selected = new Set(postData.tags || []);
    el.innerHTML = tags.map(t => `
        <button type="button" data-tag="${t}" class="tag-chip px-3 py-1 rounded-full border text-sm font-semibold ${selected.has(t) ? 'bg-primary text-white' : 'bg-white dark:bg-black/20 text-gray-700'}">
            #${t}
        </button>
    `).join('');

    // bind toggle
    el.querySelectorAll('.tag-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            const idx = (postData.tags || []).indexOf(tag);
            if (idx === -1) {
                postData.tags = [...(postData.tags || []), tag];
            } else {
                postData.tags = (postData.tags || []).filter(t => t !== tag);
            }
            renderTagSuggestionsUI(tags);
        });
    });
}

// Wire up live tag suggestions while user types
let tagSuggestionTimeout = null;
function updateTagSuggestionsLive() {
    const title = document.getElementById('questionTitle')?.value || '';
    if (!title.trim() || title.length < 5) return;

    // Debounce to avoid excessive AI calls
    clearTimeout(tagSuggestionTimeout);
    tagSuggestionTimeout = setTimeout(async () => {
        try {
            const aiUrl = API_BASE_URL.replace('/community', '/ai/suggest-tags');
            const response = await authFetch(aiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.tags && data.tags.length > 0) {
                    renderTagSuggestionsUI(data.tags);
                    return;
                }
            }
        } catch (e) {
            console.warn('AI tag suggestion failed, falling back to local extraction', e);
        }

        // Fallback to local logic if AI fails
        const tags = generateTagsFromText(title);
        renderTagSuggestionsUI(tags);
    }, 800);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
        window.location.href = 'login.html?redirect=create-post.html';
        return;
    }

    // 2. Check Topic Context
    const urlParams = new URLSearchParams(window.location.search);
    const topicParam = urlParams.get('topic'); // e.g. 'education-loan'

    if (topicParam && topicMap[topicParam]) {
        postData.category = topicMap[topicParam];
    } else {
        // Default is already General Discussion
    }

    // 2b. Show Category Badge with icon
    renderCategoryBadge(postData.category);

    // 3. Init UI
    updateUI();

    // 4. Bind Events
    document.getElementById('nextBtn').onclick = handleNext;
    document.getElementById('backBtn').onclick = handleBack;

    // Live tag suggestions while typing (title only per requirement)
    const titleEl = document.getElementById('questionTitle');
    if (titleEl) titleEl.addEventListener('input', updateTagSuggestionsLive);

    // Cancel / Edit buttons
    document.getElementById('cancelPostBtn').onclick = () => {
        // Just go back to editing or step 0
        if (currentStep === 4) {
            currentStep = 2; // Go back to edit details
            moderationBlocked = false;
            moderationReason = '';
            updateUI();
        } else {
            window.history.back();
        }
    };

    // Edit My Question button on duplicate step
    const editQuestionBtn = document.getElementById('editQuestionBtn');
    if (editQuestionBtn) {
        editQuestionBtn.onclick = () => {
            currentStep = 1; // Go back to title editing
            updateUI();
        };
    }

    // Edit button on blocked/off-topic step
    const editBlockedBtn = document.getElementById('editBlockedBtn');
    if (editBlockedBtn) {
        editBlockedBtn.onclick = () => {
            moderationBlocked = false;
            moderationReason = '';
            currentStep = 2;
            updateUI();
        };
    }

    // Post Anyway button (allow duplicates) — proceed to post even if AI finds similar questions
    const postAnywayBtn = document.getElementById('postAnywayBtn');
    if (postAnywayBtn) {
        postAnywayBtn.onclick = async () => {
            // Show posting state and continue
            currentStep = 3;
            updateUI();
            await finalizePost();
        };
    }

    // Go to Discussion button logic depends on if we save the result ID
    // We'll set it dynamically in finalizePost
});

function updateUI() {
    // Steps visibility
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step4Duplicate').classList.add('hidden');
    document.getElementById('step5Success').classList.add('hidden');

    // Buttons
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const duplicateActions = document.getElementById('duplicateActions');
    const wizardFooter = document.getElementById('wizardFooter');

    wizardFooter.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    duplicateActions.classList.add('hidden');

    if (currentStep === 1) {
        document.getElementById('step1').classList.remove('hidden');
        backBtn.classList.add('hidden');
        nextBtn.textContent = 'Next';
        updateProgress(33);
    } else if (currentStep === 2) {
        document.getElementById('step2').classList.remove('hidden');
        backBtn.classList.remove('hidden');
        nextBtn.textContent = 'Analyze & Post';
        updateProgress(66);
    } else if (currentStep === 3) {
        document.getElementById('step3').classList.remove('hidden');
        wizardFooter.classList.add('hidden'); // No buttons while loading
        updateProgress(80);
    } else if (currentStep === 4) { // Duplicate Found OR Blocked
        // If moderation blocked, show blocked UI; otherwise show duplicate list
        if (moderationBlocked) {
            document.getElementById('step4Blocked').classList.remove('hidden');
            // show footer so user can edit
            wizardFooter.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            duplicateActions.classList.add('hidden');
        } else {
            document.getElementById('step4Duplicate').classList.remove('hidden');
            // Show footer and reveal duplicate actions so user may choose to "Post Anyway"
            wizardFooter.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            duplicateActions.classList.remove('hidden');
        }
        updateProgress(100);
    } else if (currentStep === 5) { // Success
        document.getElementById('step5Success').classList.remove('hidden');
        wizardFooter.classList.add('hidden');
        updateProgress(100);
    }
}

function updateProgress(percent) {
    document.getElementById('progressBar').style.width = `${percent}%`;
}

async function handleNext() {
    if (currentStep === 1) {
        const title = document.getElementById('questionTitle').value.trim();
        if (!title) return alert('Please enter a question title.');

        postData.title = title;
        currentStep = 2;
        updateUI();

    } else if (currentStep === 2) {
        const content = document.getElementById('questionContent').value.trim();
        postData.content = content || postData.title || '';

        // Short excerpt/summary (user can provide or we auto-generate a short preview)
        const excerptEl = document.getElementById('questionExcerpt');
        const excerptVal = excerptEl ? excerptEl.value.trim() : '';
        postData.excerpt = excerptVal || (postData.content ? (postData.content.length > 160 ? postData.content.substring(0, 160) + '...' : postData.content) : '');

        // 1) Moderate content locally (quick rejection for profanity/off-topic)
        const combinedText = `${postData.title} ${postData.content} ${postData.excerpt}`;
        const mod = moderateContent(combinedText);
        if (!mod.allowed) {
            moderationBlocked = true;
            moderationReason = mod.reason;
            // show blocked UI with reason
            const reasonText = mod.reason === 'prohibited_content'
                ? 'Your post contains prohibited language or illegal content.'
                : 'This topic is not allowed here. Vidhya Path Aid is focused exclusively on Education, Student Loans, Visas, and Study Abroad. Please keep your questions related to these topics only.';
            const reasonEl = document.getElementById('blockedReasonText');
            if (reasonEl) reasonEl.textContent = reasonText;
            currentStep = 4; // blocked/duplicate slot — updateUI will choose blocked view
            updateUI();
            return;
        }

        // 2) AI-based tags (using title only as requested)
        // If the user hasn't selected any tags yet, we can provide defaults/suggestions
        if (!postData.tags || postData.tags.length === 0) {
            const suggested = generateTagsFromText(postData.title);
            postData.tags = suggested;
            renderTagSuggestionsUI(suggested);
        }

        // Proceed to analysis for duplicates & posting
        currentStep = 3;
        updateUI();
        await analyzeContent();
    }
}

function handleBack() {
    // If auto-skipped step 0, back from step 1 should probably go nowhere or history back?
    // For now simple logic
    if (currentStep === 4) {
        currentStep = 2; // Go back to edit
    } else if (currentStep > 1) {
        currentStep--;
    }
    updateUI();
}

async function analyzeContent() {
    try {
        // Normalize category to hub slug before duplicate check so backend inspects the correct hub
        const topicSlug = getTopicSlug(postData.category);
        const payload = { ...postData, category: topicSlug };
        const response = await fetch(`${API_BASE_URL}/forum/check-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // Strict Check: If ANY similar questions found with a reasonable threshold (handled by backend usually, but here checking array length)
        // Ensure result.isDuplicate is what we trust.
        if (result.success && result.isDuplicate && result.similarQuestions.length > 0) {
            renderDuplicates(result.similarQuestions);
            currentStep = 4; // Duplicate Found - Block
        } else {
            // Unique -> Post directly
            await finalizePost();
            return;
        }
    } catch (e) {
        console.error('Check failed', e);
        // If analysis fails, deciding to be safe or lenient? 
        // User said "donot allow if exists". If check fails, we can't know.
        // Failing safe: Allow post if check crashesh? Or Block?
        // Usually allow if ecosystem is buggy, but let's try to finalize.
        await finalizePost();
        return;
    }
    updateUI();
}

async function finalizePost() {
    // Show posting state if coming from duplicates (though we blocked it, keeping function for valid path)
    if (currentStep === 4) {
        // Technically shouldn't be reached if we blocked "Post Anyway"
        document.getElementById('step4Duplicate').classList.add('hidden');
        document.getElementById('step3').classList.remove('hidden');
        document.querySelector('#step3 h3').textContent = 'Posting...';
    }

    try {
        // Use SLUG for the URL and ensure request body uses the slug as well
        const topicSlug = getTopicSlug(postData.category);
        const payload = { ...postData, category: topicSlug };

        console.debug('[create-post] Posting to hub:', topicSlug, 'payload:', payload);
        const response = await authFetch(`${API_BASE_URL}/explore/hub/${topicSlug}/forum`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json(); // Backend returns created object or wrapper

            currentStep = 5; // Success
            updateUI();

            // Setup the "Go to Discussion" button
            const btn = document.getElementById('goToDiscussionBtn');
            if (btn) {
                const postId = data.id || (data.data && data.data.id);

                if (postId) {
                    btn.onclick = () => {
                        window.location.href = `question-discussion.html?id=${postId}&topic=${topicSlug}`;
                    };
                } else {
                    btn.onclick = () => {
                        window.location.href = `engage.html?topic=${topicSlug}`;
                    };
                }
            }
        } else {
            // Try to surface server error for easier debugging
            let errBody = null;
            try { errBody = await response.json(); } catch (ignored) { errBody = await response.text().catch(() => null); }
            console.error('[create-post] Server rejected post:', response.status, errBody);
            const serverMsg = errBody && (errBody.message || errBody.error || JSON.stringify(errBody));
            alert(serverMsg || `Failed to post question (status ${response.status}). Please try again.`);
            currentStep = 2;
        }
    } catch (e) {
        console.error('[create-post] Exception while posting:', e);
        alert(e?.message || 'Failed to post question. Please try again.');
        currentStep = 2;
    }
    updateUI();
}

function renderDuplicates(questions) {
    const list = document.getElementById('duplicateList');
    const topicSlug = getTopicSlug(postData.category);

    list.innerHTML = questions.map(q => `
        <a href="question-discussion.html?id=${q.id}&topic=${topicSlug}" class="block p-5 rounded-2xl border-2 border-brand-200 dark:border-brand-800/40 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-all group bg-white dark:bg-white/5 cursor-pointer">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 mt-0.5">
                    <span class="material-symbols-rounded text-xl">forum</span>
                </div>
                <div class="flex-1">
                    <h5 class="font-bold text-gray-900 dark:text-white group-hover:text-brand-500 mb-1.5 text-base">${q.title}</h5>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${q.reason || 'Similar content detected'}</p>
                    <div class="flex items-center gap-3">
                        <span class="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2.5 py-0.5 rounded-full font-bold text-xs">${Math.round(q.similarity * 100)}% Match</span>
                        <span class="text-brand-600 dark:text-brand-400 font-semibold text-xs group-hover:underline flex items-center gap-1">Go to Discussion <span class="material-symbols-rounded text-sm">arrow_forward</span></span>
                    </div>
                </div>
            </div>
        </a>
    `).join('');
}

function getTopicSlug(categoryName) {
    return categorySlugMap[categoryName] || 'general';
}

// Render the category badge with icon and color
function renderCategoryBadge(category) {
    const badge = document.getElementById('categoryBadge');
    if (!badge) return;

    const meta = categoryMeta[category] || categoryMeta['General Discussion'];
    const colorMap = {
        green: 'bg-green-500',
        sky: 'bg-sky-500',
        blue: 'bg-blue-500',
        teal: 'bg-teal-500',
        indigo: 'bg-indigo-500',
        gray: 'bg-gray-500',
        purple: 'bg-purple-500',
        cyan: 'bg-cyan-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        violet: 'bg-violet-500'
    };

    const iconEl = document.getElementById('categoryIcon');
    const iconSymbol = document.getElementById('categoryIconSymbol');
    const nameEl = document.getElementById('categoryName');

    if (iconEl) {
        // Remove previous color classes and add new one
        iconEl.className = `w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 ${colorMap[meta.color] || 'bg-gray-500'}`;
    }
    if (iconSymbol) {
        iconSymbol.textContent = meta.icon;
    }
    if (nameEl) {
        nameEl.textContent = category;
    }

    badge.classList.remove('hidden');
}

