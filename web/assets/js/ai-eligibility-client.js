/**
 * Loan Eligibility Client-side Handler
 * Handles form submission and communicates with backend AI API
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('aiEligibilityForm');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = {
        age: parseInt(formData.get('age')),
        credit: parseInt(formData.get('credit')),
        income: parseFloat(formData.get('income')),
        loan: parseFloat(formData.get('loan')),
        employment: formData.get('employment'),
        study: formData.get('study'),
        coApplicant: formData.get('coApplicant'),
        collateral: formData.get('collateral'),
      };

      try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Checking eligibility...';

        // Call backend API
        const result = await AI_API.checkEligibility(data);

        // Format result
        const formatted = AI_API.formatEligibilityResult(result);

        // Update UI with results
        updateEligibilityDisplay(formatted);

        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;

      } catch (error) {
        console.error('Eligibility check error:', error);
        alert('Error checking eligibility. Please try again or contact support.');

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Check eligibility';
      }
    });
  }
});

/**
 * Update the eligibility display section with results
 * @param {Object} result - Formatted eligibility result
 */
function updateEligibilityDisplay(result) {
  // Update score
  const scoreText = document.getElementById('aiScoreText');
  const scoreBar = document.getElementById('aiScoreBar');
  const resultBadge = document.getElementById('aiResultBadge');

  if (scoreText) scoreText.textContent = `${Math.round(result.score)} / 100`;
  if (scoreBar) scoreBar.style.width = `${result.score}%`;

  // Update badge color based on status
  let badgeClass = 'bg-gray-200/70 text-gray-700 dark:bg-white/10 dark:text-gray-200';
  if (result.status === 'eligible') {
    badgeClass = 'bg-green-200/70 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  } else if (result.status === 'borderline') {
    badgeClass = 'bg-yellow-200/70 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  } else if (result.status === 'unlikely') {
    badgeClass = 'bg-red-200/70 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }

  if (resultBadge) {
    resultBadge.className = `text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${badgeClass}`;
    resultBadge.textContent = result.status.charAt(0).toUpperCase() + result.status.slice(1);
  }

  // Update summary
  const summaryEl = document.getElementById('aiSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="font-semibold text-lg text-gray-900 dark:text-white mb-2">${result.summary}</div>
      <div class="text-sm space-y-1 text-gray-600 dark:text-gray-300">
        <p><strong>Interest Rate Range:</strong> ${result.rateRange}</p>
        <p><strong>Loan Coverage:</strong> ${result.coverage}</p>
        <p><strong>Income-to-Loan Ratio:</strong> ${(result.ratio * 100).toFixed(1)}%</p>
      </div>
    `;
  }

  // Update recommendations (Tips)
  const recommendationsEl = document.getElementById('aiRecommendations');
  if (recommendationsEl && Array.isArray(result.tips)) {
    recommendationsEl.innerHTML = result.tips
      .map(rec => `<li class="flex items-start gap-3">
        <span class="material-symbols-outlined text-primary flex-shrink-0 mt-0.5">check_circle</span>
        <span>${rec}</span>
      </li>`)
      .join('');
  }

  // Update recommended loans
  if (result.loanOffers && result.loanOffers.primary) {
    const loanFitEl = document.getElementById('aiLoanFit');
    if (loanFitEl) loanFitEl.textContent = `${result.loanOffers.primary.fit}% Match`;

    const primaryLoanEl = document.getElementById('aiLoanPrimary');
    const primary = result.loanOffers.primary.offer;

    if (primaryLoanEl && primary) {
      primaryLoanEl.innerHTML = `
        <div class="font-semibold text-gray-900 dark:text-white mb-1">${primary.bank} - ${primary.name}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">Based on your profile</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
           <div class="bg-gray-100 dark:bg-gray-700 p-1.5 rounded">
             <span class="block text-gray-500">APR</span>
             <span class="font-bold text-primary">${primary.apr}</span>
           </div>
           <div class="bg-gray-100 dark:bg-gray-700 p-1.5 rounded">
             <span class="block text-gray-500">Coverage</span>
             <span class="font-bold text-gray-800 dark:text-gray-200">${primary.coverage}</span>
           </div>
        </div>
      `;
    }

    // Update alternatives (if available)
    const alternativesEl = document.getElementById('aiLoanAlternatives');
    if (alternativesEl) {
      const alts = result.loanOffers.alternatives || [];
      if (alts.length > 0) {
        alternativesEl.innerHTML = alts
          .map(item => {
            const offer = item.offer;
            return `<li class="flex flex-col gap-1 p-2 rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-gold-accent flex-shrink-0 text-base">star</span>
                    <span class="font-semibold text-sm">${offer.bank}</span>
                </div>
                <div class="text-xs text-gray-500 pl-6">${offer.name} • ${offer.apr}</div>
              </li>`;
          })
          .join('');
      } else {
        alternativesEl.innerHTML = '<li class="text-gray-500 text-sm pl-2">No specific alternatives found.</li>';
      }
    }
  }
}
