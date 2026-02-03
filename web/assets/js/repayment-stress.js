document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('stressForm');
    const badge = document.getElementById('stressBadge');
    const ratioText = document.getElementById('stressRatioText');
    const ratioBar = document.getElementById('stressRatioBar');
    const summary = document.getElementById('stressSummary');
    const details = document.getElementById('stressDetails');
    const scenarioDrop = document.getElementById('scenarioDrop');
    const scenarioDelay = document.getElementById('scenarioDelay');
    const suggestions = document.getElementById('stressSuggestions');

    if (!form) {
        return;
    }

    const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(value)));

    const getStressCategory = (ratio) => {
        if (!Number.isFinite(ratio) || ratio <= 0) {
            return { level: 'invalid', label: 'Invalid', color: 'bg-gray-200/70 text-gray-700 dark:bg-white/10 dark:text-gray-200' };
        }
        if (ratio <= 0.3) {
            return { level: 'low', label: 'Low stress', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' };
        }
        if (ratio <= 0.5) {
            return { level: 'medium', label: 'Medium stress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' };
        }
        return { level: 'high', label: 'High stress', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200' };
    };

    const updateBadge = (category) => {
        badge.className = 'text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full';
        if (category.level === 'invalid') {
            badge.textContent = 'Awaiting input';
            badge.classList.add('bg-gray-200/70', 'text-gray-700', 'dark:bg-white/10', 'dark:text-gray-200');
        } else {
            badge.textContent = category.label;
            category.color.split(' ').forEach((cls) => badge.classList.add(cls));
        }
    };

    const updateRatioBar = (ratio) => {
        const safeRatio = Math.max(0, Math.min(1.2, ratio));
        ratioBar.style.width = `${Math.min(100, safeRatio * 100)}%`;

        if (ratio <= 0.3) {
            ratioBar.className = 'h-full bg-emerald-500 transition-all';
        } else if (ratio <= 0.5) {
            ratioBar.className = 'h-full bg-amber-500 transition-all';
        } else {
            ratioBar.className = 'h-full bg-rose-500 transition-all';
        }
    };

    const buildSuggestion = (label, newEmi, newLiving, baseSalary) => {
        const disposable = baseSalary - newLiving;
        const ratio = disposable > 0 ? newEmi / disposable : Infinity;
        const category = getStressCategory(ratio);
        return {
            label,
            ratio,
            category,
            disposable,
            emi: newEmi,
            living: newLiving,
        };
    };

    const renderSuggestions = (data) => {
        const suggestionsList = [
            buildSuggestion('Reduce loan size (EMI -20%)', data.emi * 0.8, data.living, data.salary),
            buildSuggestion('Extend tenure (EMI -15%)', data.emi * 0.85, data.living, data.salary),
            buildSuggestion('Lower living cost (expenses -20%)', data.emi, data.living * 0.8, data.salary),
            buildSuggestion('Add co-applicant (EMI -10%)', data.emi * 0.9, data.living, data.salary),
        ];

        suggestions.innerHTML = suggestionsList.map((item) => {
            const ratioPercent = Number.isFinite(item.ratio) ? `${Math.round(item.ratio * 100)}%` : 'N/A';
            const badgeClass = item.category.level === 'high'
                ? 'text-rose-600 dark:text-rose-300'
                : item.category.level === 'medium'
                    ? 'text-amber-600 dark:text-amber-300'
                    : 'text-emerald-600 dark:text-emerald-300';

            return `
                <li class="flex flex-col gap-1 rounded-2xl border border-gray-200 dark:border-white/10 p-3">
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-gray-800 dark:text-gray-100">${item.label}</span>
                        <span class="text-xs font-bold uppercase ${badgeClass}">${item.category.label}</span>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">Stress ratio: ${ratioPercent} | EMI ${formatCurrency(item.emi)} | Living ${formatCurrency(item.living)}</span>
                </li>
            `;
        }).join('');
    };

    const updateScenario = (element, salary, living, emi) => {
        const disposable = salary - living;
        if (disposable <= 0) {
            element.textContent = 'Disposable income is zero or negative. Red zone warning.';
            return;
        }
        const ratio = emi / disposable;
        const category = getStressCategory(ratio);
        element.textContent = `${category.label} • Stress ratio ${Math.round(ratio * 100)}%`;
    };

    form.addEventListener('reset', () => {
        updateBadge({ level: 'invalid' });
        ratioText.textContent = '--';
        ratioBar.style.width = '0%';
        ratioBar.className = 'h-full bg-primary transition-all';
        summary.textContent = 'Enter values to see if the EMI is survivable in a bad scenario.';
        details.textContent = '';
        scenarioDrop.textContent = '--';
        scenarioDelay.textContent = '--';
        suggestions.innerHTML = '';
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const data = {
            salary: Number(document.getElementById('stressSalary').value),
            emi: Number(document.getElementById('stressEmi').value),
            living: Number(document.getElementById('stressLiving').value),
            country: document.getElementById('stressCountry').value.trim(),
        };

        const disposable = data.salary - data.living;
        let ratio = Infinity;
        if (disposable > 0) {
            ratio = data.emi / disposable;
        }

        const category = getStressCategory(ratio);
        updateBadge(category);

        const ratioPercent = Number.isFinite(ratio) ? `${Math.round(ratio * 100)}%` : 'N/A';
        ratioText.textContent = ratioPercent;
        updateRatioBar(ratio);

        if (disposable <= 0) {
            summary.textContent = 'High stress: your living expenses already exceed your salary.';
            details.textContent = `Disposable income is ${formatCurrency(disposable)}. EMI payments are not survivable.`;
        } else {
            summary.textContent = `EMI consumes ${ratioPercent} of your disposable income.`;
            details.textContent = `Disposable income: ${formatCurrency(disposable)}. EMI: ${formatCurrency(data.emi)}. Living: ${formatCurrency(data.living)}.`;
        }

        if (data.country) {
            details.textContent += ` Location: ${data.country}.`;
        }

        updateScenario(scenarioDrop, data.salary * 0.8, data.living, data.emi);
        scenarioDelay.textContent = 'No salary for 3 months. EMI must be paid from savings or support.';

        renderSuggestions(data);
    });
});
