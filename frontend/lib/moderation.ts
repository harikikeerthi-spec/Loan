/**
 * AI Moderation & Tagging Utilities
 * Ported from legacy web/assets/js/create-post.js
 */

export const EDUCATION_KEYWORDS = [
    // Loans & Finance
    'loan', 'student loan', 'education loan', 'emi', 'interest rate', 'bank', 'nbfc',
    'collateral', 'co-applicant', 'cosigner', 'sanction', 'disbursement', 'moratorium',
    'repayment', 'itr', 'form16', 'salary', 'income', 'credit score', 'cibil',
    'axis', 'sbi', 'hdfc', 'avanse', 'credila', 'incred', 'prodigy', 'mpower',
    // Education & Admissions
    'university', 'college', 'admission', 'scholarship', 'degree', 'masters', 'phd',
    'bachelors', 'mba', 'ms', 'btech', 'gpa', 'transcript', 'application', 'deadline',
    'acceptance', 'waitlist', 'enrollment', 'tuition', 'fees', 'grant', 'fellowship',
    'assistantship', 'stipend', 'funding', 'professor', 'advisor', 'campus',
    // Study Abroad
    'abroad', 'international', 'studyabroad', 'usa', 'uk', 'canada', 'australia',
    'germany', 'ireland', 'europe', 'overseas',
    // Visa & Immigration
    'visa', 'f1', 'immigration', 'i20', 'sevis', 'ds160', 'embassy', 'consulate',
    'opt', 'cpt', 'h1b', 'resident',
    // Tests
    'gre', 'gmat', 'sat', 'toefl', 'ielts', 'pte', 'duolingo', 'sop', 'lor',
    'recommendation', 'eligibility',
    // Career (academic context)
    'internship', 'placement', 'on campus', 'off campus', 'career', 'work permit'
];

export const OFF_TOPIC_KEYWORDS = [
    // Food & Cooking
    'recipe', 'ingredient', 'ingredients', 'cook', 'cooking', 'biryani', 'pizza',
    'burger', 'pasta', 'noodles', 'food', 'dish', 'meal', 'restaurant', 'chef',
    'bake', 'fry', 'boil', 'spice', 'massala', 'curry', 'snack', 'breakfast',
    'lunch', 'dinner', 'kitchen', 'tomato', 'onion', 'garlic', 'rice', 'roti',
    'bread', 'soup', 'salad', 'dessert', 'cake', 'sweet', 'chocolate',
    // Entertainment
    'movie', 'film', 'actor', 'actress', 'celebrity', 'bollywood', 'hollywood',
    'song', 'music', 'album', 'concert', 'anime', 'manga', 'show', 'series',
    'netflix', 'youtube', 'tiktok', 'reel', 'streaming',
    // Sports
    'cricket', 'football', 'soccer', 'basketball', 'tennis', 'ipl', 'fifa',
    'match', 'tournament', 'wicket', 'athlete', 'olympic', 'score',
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

export const BANNED_WORDS = [
    'bomb', 'attack', 'drugs', 'porn', 'sex', 'murder', 'kill', 'suicide',
    'weapon', 'terror', 'illegal', 'fraud', 'scam', 'hack', 'explosive', 'abuse'
];

export const STOPWORDS = [
    'the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'were', 'will',
    'would', 'could', 'should', 'have', 'has', 'had', 'from', 'your', 'you',
    'a', 'an', 'in', 'on', 'of', 'to', 'is', 'it', 'as', 'by', 'be', 'or',
    'at', 'our', 'we', 'me', 'i', 'my', 'what', 'how', 'why', 'when', 'where',
    'who', 'which', 'do', 'get', 'make', 'give', 'tell', 'want', 'need', 'please'
];

// Map Display Name -> Backend Hub Slug (Canonical)
export const CATEGORY_SLUG_MAP: Record<string, string> = {
    'Education Loans': 'eligibility',
    'Visa Process': 'visa',
    'Universities': 'universities',
    'Scholarship': 'scholarships',
    'Courses': 'courses',
    'GRE / GMAT': 'gre',
    'Exams': 'exams',
    'IELTS / TOEFL': 'gre', // Combined in legacy
    'Housing & Accommodation': 'accommodation',
    'Part-time Jobs & Careers': 'jobs',
    'General Discussion': 'general'
};

export function normalizeText(s: string): string {
    return (s || '').toLowerCase().replace(/[\W_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function containsBannedWords(text: string): boolean {
    const t = normalizeText(text);
    return BANNED_WORDS.some(b => t.includes(b));
}

export function isOffTopic(text: string): boolean {
    const t = normalizeText(text);
    return OFF_TOPIC_KEYWORDS.some(k => t.includes(k));
}

export function isTopical(text: string): boolean {
    const t = normalizeText(text);
    const matches = EDUCATION_KEYWORDS.filter(k => t.includes(k));
    // Short/vague questions need 2 matching education keywords; longer ones need at least 1
    const wordCount = t.split(' ').filter(w => w.length > 2).length;
    const requiredMatches = wordCount < 6 ? 2 : 1;
    return matches.length >= requiredMatches;
}

export function extractKeywords(text: string, limit = 6): string[] {
    const t = normalizeText(text);
    const tokens = t.split(' ').filter(w => w.length > 2 && !STOPWORDS.includes(w));
    const freq: Record<string, number> = {};
    tokens.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
    return sorted.slice(0, limit);
}

export function mapKeywordsToTags(words: string[]): string[] {
    const mapped = new Set<string>();
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

export function generateTagsFromText(text: string): string[] {
    // Always include baseline tags
    const base = new Set(['education', 'loan']);
    const kws = extractKeywords(text, 8);
    const mapped = mapKeywordsToTags(kws);
    mapped.forEach(t => base.add(t));
    return Array.from(base).slice(0, 5);
}

export function moderateContent(text: string): { allowed: boolean, reason?: string } {
    const combined = normalizeText(text);

    // 1. Hard block: explicitly off-topic content (food, sports, etc.)
    if (isOffTopic(combined)) return { allowed: false, reason: 'off_topic' };

    // 2. Prohibited content: violence, profanity, etc.
    if (containsBannedWords(combined)) return { allowed: false, reason: 'prohibited_content' };

    // 3. Must relate to education / loans
    if (!isTopical(combined)) return { allowed: false, reason: 'off_topic' };

    return { allowed: true };
}
