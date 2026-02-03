document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('aiEligibilityForm');
    const badge = document.getElementById('aiResultBadge');
    const scoreText = document.getElementById('aiScoreText');
    const scoreBar = document.getElementById('aiScoreBar');
    const summary = document.getElementById('aiSummary');
    const recommendations = document.getElementById('aiRecommendations');

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
    });
});
