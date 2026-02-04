document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('aiEligibilityForm');
    const badge = document.getElementById('aiResultBadge');
    const scoreText = document.getElementById('aiScoreText');
    const scoreBar = document.getElementById('aiScoreBar');
    const summary = document.getElementById('aiSummary');
    const recommendations = document.getElementById('aiRecommendations');
    const loanFit = document.getElementById('aiLoanFit');
    const loanPrimary = document.getElementById('aiLoanPrimary');
    const loanAlternatives = document.getElementById('aiLoanAlternatives');

    if (!form) {
        return;
    }

    const formatCurrency = (value) => {
        if (!Number.isFinite(value)) {
            return '$0';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const setBadge = (status) => {
        badge.className = 'text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full';
        if (status === 'eligible') {
            badge.textContent = 'Likely eligible';
            badge.classList.add('bg-emerald-100', 'text-emerald-700', 'dark:bg-emerald-500/20', 'dark:text-emerald-200');
        } else if (status === 'borderline') {
            badge.textContent = 'Borderline';
            badge.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-500/20', 'dark:text-amber-200');
        } else if (status === 'unlikely') {
            badge.textContent = 'Not likely';
            badge.classList.add('bg-rose-100', 'text-rose-700', 'dark:bg-rose-500/20', 'dark:text-rose-200');
        } else {
            badge.textContent = 'Awaiting input';
            badge.classList.add('bg-gray-200/70', 'text-gray-700', 'dark:bg-white/10', 'dark:text-gray-200');
        }
    };

    const setScore = (score) => {
        const safeScore = Math.max(0, Math.min(100, Math.round(score)));
        scoreText.textContent = `${safeScore} / 100`;
        scoreBar.style.width = `${safeScore}%`;

        if (safeScore >= 70) {
            scoreBar.className = 'h-full bg-emerald-500 transition-all';
        } else if (safeScore >= 50) {
            scoreBar.className = 'h-full bg-amber-500 transition-all';
        } else {
            scoreBar.className = 'h-full bg-rose-500 transition-all';
        }
    };

    const buildRecommendations = (data, score, ratio) => {
        const tips = [];

        if (data.credit < 650) {
            tips.push('Improve credit health by reducing outstanding balances before applying.');
        }
        if (ratio < 1) {
            tips.push('Consider reducing loan amount or adding a co-applicant to strengthen affordability.');
        }
        if (data.coApplicant === 'yes') {
            tips.push('Prepare co-applicant income proofs to speed up verification.');
        }
        if (data.collateral === 'no') {
            tips.push('Secured options can unlock better rates for higher loan amounts.');
        }
        if (data.employment === 'student') {
            tips.push('Collect admission and scholarship documents to support your profile.');
        }
        if (score >= 70) {
            tips.push('You are in a strong position. Start comparing lender offers.');
        }

        return tips.slice(0, 4);
    };

    const loanOffers = [
        {
            id: 'aurora-student-core',
            bank: 'Aurora Bank',
            name: 'Global Scholar Starter Loan',
            minScore: 55,
            minCredit: 640,
            minRatio: 0.8,
            maxLoan: 85000,
            requiresCoApplicant: true,
            requiresCollateral: false,
            apr: '10.2% - 12.9%',
            coverage: 'Up to 85% of course cost',
            bestFor: 'Undergraduate and masters students with co-applicant support.',
        },
        {
            id: 'veridian-secured',
            bank: 'Veridian Capital',
            name: 'Secure Path Education Loan',
            minScore: 60,
            minCredit: 670,
            minRatio: 0.9,
            maxLoan: 180000,
            requiresCoApplicant: false,
            requiresCollateral: true,
            apr: '8.8% - 11.4%',
            coverage: 'Up to 95% of course cost',
            bestFor: 'Higher loan amounts backed by collateral.',
        },
        {
            id: 'summit-premier',
            bank: 'Summit Federal',
            name: 'Premier International Student Loan',
            minScore: 70,
            minCredit: 720,
            minRatio: 1.1,
            maxLoan: 220000,
            requiresCoApplicant: false,
            requiresCollateral: false,
            apr: '8.1% - 10.5%',
            coverage: 'Up to 90% of course cost',
            bestFor: 'Strong credit profiles seeking competitive rates.',
        },
        {
            id: 'nova-flex',
            bank: 'Nova Learners Bank',
            name: 'Flexi Study Loan',
            minScore: 48,
            minCredit: 610,
            minRatio: 0.7,
            maxLoan: 60000,
            requiresCoApplicant: false,
            requiresCollateral: false,
            apr: '12.0% - 15.8%',
            coverage: 'Up to 70% of course cost',
            bestFor: 'Students needing smaller loan sizes with quick approvals.',
        },
        {
            id: 'harbor-support',
            bank: 'Harbor Trust',
            name: 'Co-Applicant Advantage Loan',
            minScore: 50,
            minCredit: 630,
            minRatio: 0.75,
            maxLoan: 120000,
            requiresCoApplicant: true,
            requiresCollateral: false,
            apr: '9.9% - 12.6%',
            coverage: 'Up to 88% of course cost',
            bestFor: 'Applicants with a reliable co-applicant and stable income.',
        },
    ];

    const scoreOfferFit = (offer, data, score, ratio) => {
        let fit = 0;

        if (score >= offer.minScore) {
            fit += 25;
        } else {
            fit -= (offer.minScore - score);
        }

        if (data.credit >= offer.minCredit) {
            fit += 20;
        } else {
            fit -= (offer.minCredit - data.credit) / 5;
        }

        if (ratio >= offer.minRatio) {
            fit += 20;
        } else {
            fit -= (offer.minRatio - ratio) * 40;
        }

        if (data.loan <= offer.maxLoan) {
            fit += 15;
        } else {
            fit -= (data.loan - offer.maxLoan) / 2000;
        }

        if (offer.requiresCoApplicant) {
            fit += data.coApplicant === 'yes' ? 10 : -20;
        }

        if (offer.requiresCollateral) {
            fit += data.collateral === 'yes' ? 10 : -20;
        }

        if (data.study === 'doctoral' || data.study === 'masters') {
            fit += 5;
        }

        return fit;
    };

    const getLoanRecommendations = (data, score, ratio) => {
        const scored = loanOffers.map((offer) => ({
            offer,
            fit: scoreOfferFit(offer, data, score, ratio),
        }));

        scored.sort((a, b) => b.fit - a.fit);

        const primary = scored[0];
        const alternatives = scored.slice(1, 3);

        return { primary, alternatives };
    };

    const calculateScore = (data) => {
        let score = 0;

        if (data.age >= 18 && data.age <= 60) {
            score += 15;
        } else {
            score -= 20;
        }

        if (data.credit >= 750) {
            score += 25;
        } else if (data.credit >= 700) {
            score += 15;
        } else if (data.credit >= 650) {
            score += 8;
        } else if (data.credit >= 600) {
            score += 2;
        } else {
            score -= 15;
        }

        if (data.employment === 'employed') {
            score += 10;
        } else if (data.employment === 'self') {
            score += 7;
        } else if (data.employment === 'student') {
            score += 4;
        } else {
            score -= 10;
        }

        if (data.study === 'masters') {
            score += 6;
        } else if (data.study === 'doctoral') {
            score += 7;
        } else if (data.study === 'undergrad') {
            score += 4;
        } else {
            score += 2;
        }

        if (data.coApplicant === 'yes') {
            score += 8;
        }

        if (data.collateral === 'yes') {
            score += 10;
        }

        const ratio = data.income / Math.max(1, data.loan);
        if (ratio >= 1.5) {
            score += 20;
        } else if (ratio >= 1) {
            score += 12;
        } else if (ratio >= 0.6) {
            score += 6;
        } else {
            score -= 10;
        }

        return { score, ratio };
    };

    form.addEventListener('reset', () => {
        setBadge('idle');
        setScore(0);
        summary.textContent = 'Complete the form to see a personalized eligibility estimate.';
        recommendations.innerHTML = '';
        if (loanFit) {
            loanFit.textContent = 'Awaiting input';
        }
        if (loanPrimary) {
            loanPrimary.textContent = 'Submit the form to see the best-fit loan and bank for your profile.';
        }
        if (loanAlternatives) {
            loanAlternatives.innerHTML = '';
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const data = {
            age: Number(document.getElementById('aiAge').value),
            credit: Number(document.getElementById('aiCredit').value),
            income: Number(document.getElementById('aiIncome').value),
            loan: Number(document.getElementById('aiLoan').value),
            employment: document.getElementById('aiEmployment').value,
            study: document.getElementById('aiStudy').value,
            coApplicant: document.getElementById('aiCoApplicant').value,
            collateral: document.getElementById('aiCollateral').value,
        };

        const { score, ratio } = calculateScore(data);
        const normalized = Math.max(0, Math.min(100, score));

        let status = 'unlikely';
        if (normalized >= 70) {
            status = 'eligible';
        } else if (normalized >= 50) {
            status = 'borderline';
        }

        setBadge(status);
        setScore(normalized);

        const rateRange = normalized >= 70 ? '8.5% - 10.9%' : normalized >= 50 ? '10.5% - 13.5%' : '12.5% - 16.5%';
        const coverage = normalized >= 70 ? 'Up to 95% of course cost' : normalized >= 50 ? 'Up to 80% of course cost' : 'Up to 60% of course cost';

        summary.textContent = `Based on your profile, estimated coverage is ${coverage}. Expected rate range: ${rateRange}. Your affordability ratio is ${ratio.toFixed(2)} with an annual income of ${formatCurrency(data.income)}.`;

        const tips = buildRecommendations(data, normalized, ratio);
        recommendations.innerHTML = tips
            .map((tip) => `<li class="flex gap-3"><span class="material-symbols-outlined text-primary text-base">check_circle</span><span>${tip}</span></li>`)
            .join('');

        if (loanFit && loanPrimary && loanAlternatives) {
            const { primary, alternatives } = getLoanRecommendations(data, normalized, ratio);
            const fitLabel = primary.fit >= 60 ? 'Strong match' : primary.fit >= 40 ? 'Good match' : 'Needs review';
            loanFit.textContent = fitLabel;

            loanPrimary.innerHTML = `
                <span class="font-semibold text-gray-900 dark:text-white">${primary.offer.name}</span>
                <span class="text-gray-500 dark:text-gray-400"> • ${primary.offer.bank}</span><br />
                <span class="text-gray-600 dark:text-gray-300">${primary.offer.coverage} • ${primary.offer.apr}</span><br />
                <span class="text-xs text-gray-500 dark:text-gray-400">${primary.offer.bestFor}</span>
            `;

            loanAlternatives.innerHTML = alternatives
                .map(({ offer }) => `
                    <li class="flex flex-col">
                        <span class="font-semibold text-gray-800 dark:text-gray-200">${offer.name} · ${offer.bank}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${offer.coverage} • ${offer.apr}</span>
                    </li>
                `)
                .join('');
        }
    });
});
// ============================================
// SOP QUALITY SCORER
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const sopForm = document.getElementById('sopScorerForm');
    if (!sopForm) return;

    const sopText = document.getElementById('sopText');
    const sopResultBadge = document.getElementById('sopResultBadge');
    const sopScoreText = document.getElementById('sopScoreText');
    const sopScoreBar = document.getElementById('sopScoreBar');
    const sopCategoryScores = document.getElementById('sopCategoryScores');
    const sopWeakAreas = document.getElementById('sopWeakAreas');
    const sopSummary = document.getElementById('sopSummary');

    const setSopBadge = (quality) => {
        sopResultBadge.className = 'text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full';
        if (quality === 'excellent') {
            sopResultBadge.textContent = 'Excellent';
            sopResultBadge.classList.add('bg-emerald-100', 'text-emerald-700', 'dark:bg-emerald-500/20', 'dark:text-emerald-200');
        } else if (quality === 'good') {
            sopResultBadge.textContent = 'Good';
            sopResultBadge.classList.add('bg-cyan-100', 'text-cyan-700', 'dark:bg-cyan-500/20', 'dark:text-cyan-200');
        } else if (quality === 'fair') {
            sopResultBadge.textContent = 'Fair';
            sopResultBadge.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-500/20', 'dark:text-amber-200');
        } else if (quality === 'needs-work') {
            sopResultBadge.textContent = 'Needs Work';
            sopResultBadge.classList.add('bg-rose-100', 'text-rose-700', 'dark:bg-rose-500/20', 'dark:text-rose-200');
        } else {
            sopResultBadge.textContent = 'Awaiting input';
            sopResultBadge.classList.add('bg-gray-200/70', 'text-gray-700', 'dark:bg-white/10', 'dark:text-gray-200');
        }
    };

    const setSopScore = (score) => {
        const safeScore = Math.max(0, Math.min(100, Math.round(score)));
        sopScoreText.textContent = `${safeScore} / 100`;
        sopScoreBar.style.width = `${safeScore}%`;

        if (safeScore >= 80) {
            sopScoreBar.className = 'h-full bg-emerald-500 transition-all';
        } else if (safeScore >= 65) {
            sopScoreBar.className = 'h-full bg-cyan-500 transition-all';
        } else if (safeScore >= 50) {
            sopScoreBar.className = 'h-full bg-amber-500 transition-all';
        } else {
            sopScoreBar.className = 'h-full bg-rose-500 transition-all';
        }
    };

    const analyzeSopClarity = (text) => {
        let score = 0;
        let feedback = [];

        // Check average sentence length (ideal: 15-20 words)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = text.split(/\s+/).length / Math.max(1, sentences.length);
        
        if (avgSentenceLength > 25) {
            score += 10;
            feedback.push({ issue: 'Clarity is compromised', recommendation: 'Simplify long sentences (avg: ' + avgSentenceLength.toFixed(1) + ' words)' });
        } else if (avgSentenceLength > 20) {
            score += 15;
        } else {
            score += 20;
        }

        // Check for jargon usage (complex words)
        const complexWords = (text.match(/\b(?:notwithstanding|aforementioned|heretofore|thereof|herewith)\b/gi) || []).length;
        if (complexWords > 0) {
            feedback.push({ issue: 'Excessive jargon detected', recommendation: 'Simplify technical language for better clarity' });
        } else {
            score += 5;
        }

        return { score, feedback };
    };

    const analyzeFinancialJustification = (text) => {
        let score = 0;
        let feedback = [];

        const lowerText = text.toLowerCase();

        // Check for financial keywords
        const financialKeywords = ['investment', 'return', 'cost', 'scholarship', 'tuition', 'expense', 'funding', 'afford', 'loan', 'financial'];
        const keywordMatches = financialKeywords.filter(k => lowerText.includes(k)).length;

        if (keywordMatches >= 6) {
            score += 25;
        } else if (keywordMatches >= 4) {
            score += 18;
        } else if (keywordMatches >= 2) {
            score += 10;
            feedback.push({ issue: 'Limited financial justification', recommendation: 'Explain how the loan serves your goals and why it\'s a sound investment' });
        } else {
            feedback.push({ issue: 'No financial justification found', recommendation: 'Address how you\'ll manage costs and repay the loan' });
        }

        // Check for family/background context
        if (lowerText.includes('family') || lowerText.includes('background') || lowerText.includes('support')) {
            score += 5;
        }

        return { score, feedback };
    };

    const analyzeCareerROI = (text) => {
        let score = 0;
        let feedback = [];

        const lowerText = text.toLowerCase();

        // Check for career planning keywords
        const careerKeywords = ['career', 'goal', 'aspiration', 'profession', 'industry', 'role', 'position', 'company', 'opportunity'];
        const careerMatches = careerKeywords.filter(k => lowerText.includes(k)).length;

        if (careerMatches >= 7) {
            score += 25;
        } else if (careerMatches >= 5) {
            score += 18;
        } else if (careerMatches >= 3) {
            score += 10;
            feedback.push({ issue: 'Career ROI unclear', recommendation: 'Clearly articulate your post-study career goals and how this education enables them' });
        } else {
            feedback.push({ issue: 'Missing career trajectory', recommendation: 'Explain specific roles and industries you aim to work in after graduation' });
        }

        // Check for income/salary expectations
        if (lowerText.includes('salary') || lowerText.includes('income') || lowerText.includes('earning')) {
            score += 5;
        }

        // Check for skill development
        if (lowerText.includes('skill') || lowerText.includes('competence') || lowerText.includes('expertise')) {
            score += 5;
        }

        return { score, feedback };
    };

    const analyzeOriginality = (text) => {
        let score = 0;
        let feedback = [];
        const lowerText = text.toLowerCase();

        // Check for personal anecdotes/examples
        const firstPersonCount = (text.match(/\bI\b|my|me\b/gi) || []).length;
        
        if (firstPersonCount > 30) {
            score += 15;
        } else if (firstPersonCount > 15) {
            score += 10;
        } else {
            score += 5;
            feedback.push({ issue: 'Lacks personal voice', recommendation: 'Share specific personal experiences and motivations, not generic statements' });
        }

        // Check for clichés
        const clicheKeywords = ['unique opportunity', 'passion for learning', 'make a difference', 'change the world', 'leverage my skills'];
        const clicheCount = clicheKeywords.filter(c => lowerText.includes(c.toLowerCase())).length;
        
        if (clicheCount > 3) {
            feedback.push({ issue: 'Common clichés detected', recommendation: 'Replace overused phrases with specific, personal examples' });
        } else {
            score += 10;
        }

        // Check for specific examples
        const hasNumbers = /\d+(?:%|year|degree|gpa|score)?/i.test(text);
        const hasSpecificNames = /(?:company|university|project|course|field):\s*[A-Z]/i.test(text);
        
        if (hasNumbers && hasSpecificNames) {
            score += 10;
        } else if (hasNumbers || hasSpecificNames) {
            score += 5;
        }

        return { score, feedback };
    };

    const scorePost_StudyIncomeClarity = (text) => {
        let score = 0;
        let feedback = [];

        const lowerText = text.toLowerCase();

        // Check for post-study plans
        const postStudyKeywords = ['after graduation', 'upon completion', 'post-study', 'following degree', 'after course'];
        const postStudyMentioned = postStudyKeywords.some(k => lowerText.includes(k));

        if (!postStudyMentioned) {
            feedback.push({ issue: 'Post-study income clarity weak', recommendation: 'Specify expected income/salary after graduation and how you\'ll repay the loan' });
        } else {
            score += 15;
        }

        // Check for income expectations
        if (lowerText.includes('salary') || lowerText.includes('income') || lowerText.includes('earn')) {
            score += 15;
        } else {
            score += 5;
        }

        return { score, feedback };
    };

    const calculateSopScore = (text) => {
        if (text.trim().length < 100) {
            return {
                totalScore: 0,
                categories: [],
                allFeedback: [{ issue: 'Text too short', recommendation: 'Provide at least 100 words for accurate analysis' }],
                quality: 'needs-work'
            };
        }

        const clarity = analyzeSopClarity(text);
        const financial = analyzeFinancialJustification(text);
        const careerROI = analyzeCareerROI(text);
        const originality = analyzeOriginality(text);
        const postIncome = scorePost_StudyIncomeClarity(text);

        const categories = [
            { name: 'Clarity', score: Math.max(0, Math.min(20, clarity.score)), weight: 0.15 },
            { name: 'Financial Justification', score: Math.max(0, Math.min(25, financial.score)), weight: 0.25 },
            { name: 'Career ROI', score: Math.max(0, Math.min(25, careerROI.score)), weight: 0.25 },
            { name: 'Originality', score: Math.max(0, Math.min(20, originality.score)), weight: 0.20 },
            { name: 'Post-Study Income Clarity', score: Math.max(0, Math.min(10, postIncome.score)), weight: 0.15 },
        ];

        const totalScore = categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0);
        const allFeedback = [
            ...clarity.feedback,
            ...financial.feedback,
            ...careerROI.feedback,
            ...originality.feedback,
            ...postIncome.feedback,
        ];

        let quality = 'needs-work';
        if (totalScore >= 80) quality = 'excellent';
        else if (totalScore >= 65) quality = 'good';
        else if (totalScore >= 50) quality = 'fair';

        return { totalScore, categories, allFeedback, quality };
    };

    sopForm.addEventListener('reset', () => {
        setSopBadge('idle');
        setSopScore(0);
        sopCategoryScores.innerHTML = '';
        sopWeakAreas.innerHTML = '';
        sopSummary.textContent = 'Complete the form to see a comprehensive SOP evaluation for loan approval.';
    });

    sopForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const text = sopText.value.trim();
        const analysis = calculateSopScore(text);

        setSopBadge(analysis.quality);
        setSopScore(analysis.totalScore);

        sopCategoryScores.innerHTML = analysis.categories
            .map(cat => `
                <div class="flex items-center justify-between">
                    <span class="text-gray-700 dark:text-gray-300">${cat.name}</span>
                    <span class="font-semibold text-gray-900 dark:text-white">${cat.score.toFixed(0)}/25</span>
                </div>
            `)
            .join('');

        sopWeakAreas.innerHTML = analysis.allFeedback.length > 0
            ? analysis.allFeedback
                .map(item => `
                    <li class="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                        <span class="material-symbols-outlined text-base text-red-600 dark:text-red-400 shrink-0">info</span>
                        <div class="flex-1">
                            <p class="font-semibold text-red-700 dark:text-red-300">${item.issue}</p>
                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">${item.recommendation}</p>
                        </div>
                    </li>
                `)
                .join('')
            : '<li class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-base">check_circle</span>Excellent! No major issues found.</li>';

        let summaryText = '';
        if (analysis.totalScore >= 80) {
            summaryText = '🎯 Your SOP is compelling for loan approval. Strong financial justification, clear career goals, and personal voice make this application-ready.';
        } else if (analysis.totalScore >= 65) {
            summaryText = '✅ Good SOP with solid structure. Focus on strengthening career ROI clarity and post-study income expectations to boost approval chances.';
        } else if (analysis.totalScore >= 50) {
            summaryText = '⚠️ Your SOP needs revision. Prioritize adding specific financial justification and career trajectory to improve loan approval prospects.';
        } else {
            summaryText = '🔧 Significant improvements needed. Rewrite focusing on: (1) Financial necessity, (2) Career goals, (3) Personal motivation.';
        }

        sopSummary.textContent = summaryText;
    });
});