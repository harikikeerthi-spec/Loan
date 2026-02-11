/**
 * SOP Analysis Client-side Handler
 * Handles form submission and communicates with backend AI API for SOP analysis
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('sopScorerForm');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get SOP text from form
      const sopText = document.getElementById('sopText')?.value || '';

      if (!sopText.trim()) {
        alert('Please enter your Statement of Purpose before analyzing.');
        return;
      }

      try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Analyzing your SOP...';

        // Call backend API
        const result = await AI_API.analyzeSOP(sopText);

        // Format result
        const formatted = AI_API.formatSOPResult(result);

        // Update UI with results
        updateSOPDisplay(formatted);

        // Show humanize button if humanize score is below 85
        const humanizeBtn = document.getElementById('humanizeBtn');
        if (humanizeBtn) {
          if (formatted.humanizeScore < 85) {
            humanizeBtn.classList.remove('hidden');
          } else {
            humanizeBtn.classList.add('hidden');
          }
        }

        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;

      } catch (error) {
        console.error('SOP analysis error:', error);
        alert('Error analyzing your SOP. Please try again or contact support.');

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Analyze SOP';
      }
    });
  }
});

/**
 * Humanize SOP functionality for the Evaluation page
 */
async function humanizeSOPInScorer() {
  const sopTextarea = document.getElementById('sopText');
  const humanizeBtn = document.getElementById('humanizeBtn');

  if (!sopTextarea || !sopTextarea.value.trim()) return;

  const originalHtml = humanizeBtn.innerHTML;
  humanizeBtn.disabled = true;
  humanizeBtn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">progress_activity</span> Humanizing...';

  try {
    const result = await AI_API.humanizeSOP(sopTextarea.value);
    if (result.success && result.humanizedText) {
      // Update the textarea with humanized text
      sopTextarea.value = result.humanizedText;

      // Re-analyze automatically
      const analyzeBtn = document.querySelector('#sopScorerForm button[type="submit"]');
      if (analyzeBtn) analyzeBtn.click();

      // Notification or visual feedback
      alert('✨ SOP has been humanized! Review the changes and the updated scores.');
    }
  } catch (error) {
    console.error('Humanization failed:', error);
    alert('Error humanizing SOP. Please try again.');
  } finally {
    humanizeBtn.disabled = false;
    humanizeBtn.innerHTML = originalHtml;
  }
}

/**
 * Update the SOP analysis display section with results
 * @param {Object} result - Formatted SOP analysis result
 */
function updateSOPDisplay(result) {
  // Update score and quality badge (FIXED: IDs now match sop.html)
  const scoreText = document.getElementById('sopScoreText');
  const scoreBar = document.getElementById('sopScoreBar');
  const qualityBadge = document.getElementById('sopResultBadge');

  if (scoreText) scoreText.textContent = `${Math.round(result.score)} / 100`;
  if (scoreBar) scoreBar.style.width = `${result.score}%`;

  // Update quality badge color and text
  let badgeClass = 'bg-gray-200/70 text-gray-700 dark:bg-white/10 dark:text-gray-200';
  let badgeText = result.quality.toUpperCase();

  if (result.quality === 'excellent') {
    badgeClass = 'bg-green-200/70 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  } else if (result.quality === 'good') {
    badgeClass = 'bg-blue-200/70 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  } else if (result.quality === 'fair') {
    badgeClass = 'bg-yellow-200/70 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  } else if (result.quality === 'poor') {
    badgeClass = 'bg-red-200/70 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }

  if (qualityBadge) {
    qualityBadge.className = `text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${badgeClass}`;
    qualityBadge.textContent = badgeText;
  }

  // Update Humanize Score
  updateHumanizeScore(result.humanizeScore, result.humanizeFeedback);

  // Update Plagiarism Score  
  updatePlagiarismScore(result.plagiarismScore, result.plagiarismFeedback);

  // Update category breakdown
  updateCategoryBreakdown(result.categories);

  // Update weak areas
  updateWeakAreas(result.weakAreas);

  // Update summary
  updateActionableSummary(result.actionableSummary);
}

/**
 * Update humanize score display
 * @param {number} score - Humanize score (0-100, higher is better)
 * @param {string} feedback - Feedback on humanization
 */
function updateHumanizeScore(score, feedback) {
  const scoreText = document.getElementById('humanizeScoreText');
  const scoreBar = document.getElementById('humanizeScoreBar');
  const feedbackEl = document.getElementById('humanizeFeedback');
  const humanizeSection = feedbackEl?.parentElement;

  const roundedScore = Math.round(score || 0);

  // Determine quality level and color coding
  let qualityClass = '';
  let borderClass = '';
  let warningMessage = '';

  if (roundedScore >= 90) {
    qualityClass = 'text-green-700 dark:text-green-300';
    borderClass = 'border-green-500';
    warningMessage = '✅ Excellent! Your SOP sounds genuinely human-written.';
  } else if (roundedScore >= 75) {
    qualityClass = 'text-yellow-700 dark:text-yellow-300';
    borderClass = 'border-yellow-500';
    warningMessage = '⚠️ Warning: Your SOP may be detected as AI-generated. Improve authenticity!';
  } else {
    qualityClass = 'text-red-700 dark:text-red-300';
    borderClass = 'border-red-500';
    warningMessage = '❌ Critical: This SOP appears AI-generated. Rewrite with personal stories!';
  }

  if (scoreText) {
    scoreText.className = `text-sm font-bold ${qualityClass}`;
    scoreText.textContent = `${roundedScore} / 100`;
  }

  if (scoreBar) scoreBar.style.width = `${roundedScore}%`;

  // Update section border for visual emphasis
  if (humanizeSection) {
    humanizeSection.className = `mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border-2 ${borderClass}`;
  }

  if (feedbackEl && feedback) {
    feedbackEl.innerHTML = `
      <div class="mb-2 font-bold ${qualityClass}">${warningMessage}</div>
      <div class="mt-2"><strong>💡 How to Improve:</strong> ${feedback}</div>
    `;
    feedbackEl.classList.remove('hidden');
  }
}

/**
 * Update plagiarism score display
 * @param {number} score - Plagiarism score (0-100, lower is better)
 * @param {string} feedback - Feedback on originality
 */
function updatePlagiarismScore(score, feedback) {
  const scoreText = document.getElementById('plagiarismScoreText');
  const scoreBar = document.getElementById('plagiarismScoreBar');
  const feedbackEl = document.getElementById('plagiarismFeedback');

  const roundedScore = Math.round(score || 0);

  // For plagiarism, we want to show the inverse (originality %)
  const originalityScore = 100 - roundedScore;

  if (scoreText) {
    // Show plagiarism percentage with quality indicator
    let qualityText = '';
    if (roundedScore <= 15) qualityText = '✅ Excellent';
    else if (roundedScore <= 30) qualityText = '👍 Good';
    else if (roundedScore <= 50) qualityText = '⚠️ Fair';
    else qualityText = '❌ Needs Work';

    scoreText.textContent = `${roundedScore}% ${qualityText}`;
  }

  if (scoreBar) scoreBar.style.width = `${originalityScore}%`;

  if (feedbackEl && feedback) {
    feedbackEl.innerHTML = `<strong>📝 Originality:</strong> ${feedback}`;
    feedbackEl.classList.remove('hidden');
  }
}


/**
 * Update the category breakdown display
 * @param {Object} categories - Category scores (clarity, financial, career, originality, postStudy)
 */
function updateCategoryBreakdown(categories) {
  const categoryContainer = document.getElementById('sopCategoryScores');
  if (!categoryContainer) return;

  const categoryNames = {
    clarity: { label: 'Clarity', color: 'bg-blue-500' },
    financialJustification: { label: 'Financial Justification', color: 'bg-green-500' },
    careerROI: { label: 'Career ROI', color: 'bg-purple-500' },
    originality: { label: 'Originality', color: 'bg-pink-500' },
    postStudyIncome: { label: 'Post-Study Income', color: 'bg-orange-500' },
  };

  categoryContainer.innerHTML = Object.entries(categories).map(([key, value]) => {
    const config = categoryNames[key] || { label: key, color: 'bg-gray-500' };
    const score = Math.round(value);

    return `
      <div class="mb-4">
        <div class="flex items-center justify-between text-sm mb-1">
          <span class="font-semibold text-gray-700 dark:text-gray-200">${config.label}</span>
          <span class="text-xs font-bold text-gray-600 dark:text-gray-300">${score}%</span>
        </div>
        <div class="h-2 w-full bg-gray-200/80 dark:bg-white/10 rounded-full overflow-hidden">
          <div class="h-full ${config.color} transition-all" style="width: ${score}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Update weak areas and recommendations
 * @param {Array} weakAreas - Array of weak area feedback
 */
function updateWeakAreas(weakAreas) {
  const weakAreasEl = document.getElementById('sopWeakAreas');
  if (!weakAreasEl) return;

  if (weakAreas && weakAreas.length > 0) {
    weakAreasEl.innerHTML = `
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Areas to Improve:</h4>
      <ul class="space-y-2">
        ${weakAreas.map(area => `
          <li class="flex items-start gap-2">
            <span class="material-symbols-outlined text-warning text-base flex-shrink-0 mt-0.5">warning</span>
            <span class="text-sm text-gray-600 dark:text-gray-300">${area}</span>
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    weakAreasEl.innerHTML = `
      <div class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <span class="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
        <span class="text-sm font-semibold text-green-700 dark:text-green-300">Great! No major weak areas detected.</span>
      </div>
    `;
  }
}

/**
 * Update actionable summary
 * @param {string} summary - Actionable summary text
 */
function updateActionableSummary(summary) {
  const summaryEl = document.getElementById('sopSummary');
  if (!summaryEl) return;

  summaryEl.innerHTML = `
    <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Next Steps:</h4>
    <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">${summary}</p>
  `;
}
