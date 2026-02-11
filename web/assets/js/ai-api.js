/**
 * AI Tools API Client
 * Communicates with backend AI services for eligibility checking, loan recommendations, and SOP analysis
 */

const AI_API = {
  BASE_URL: 'http://localhost:3000/ai',

  /**
   * Check loan eligibility based on user profile
   * @param {Object} data - User eligibility data
   * @returns {Promise<Object>} - Eligibility score, status, and loan recommendations
   */
  async checkEligibility(data) {
    try {
      const response = await fetch(`${this.BASE_URL}/eligibility-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Eligibility check failed:', error);
      throw error;
    }
  },

  /**
   * Analyze Statement of Purpose for loan approval
   * @param {string} text - SOP text content
   * @returns {Promise<Object>} - Analysis score, quality level, feedback, and recommendations
   */
  async analyzeSOP(text) {
    try {
      const response = await fetch(`${this.BASE_URL}/sop-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // Backend may return { success, analysis } or { success, data } depending on version.
      return result?.data ?? result?.analysis ?? result;
    } catch (error) {
      console.error('SOP analysis failed:', error);
      throw error;
    }
  },

  async humanizeSOP(text) {
    try {
      const response = await fetch(`${this.BASE_URL}/humanize-sop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SOP humanization failed:', error);
      throw error;
    }
  },

  async predictAdmission(data) {
    try {
      const response = await fetch(`${this.BASE_URL}/predict-admission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Admission prediction failed:', error);
      throw error;
    }
  },

  async compareUniversities(data) {
    try {
      const response = await fetch(`${this.BASE_URL}/compare-universities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('University comparison failed:', error);
      throw error;
    }
  },

  /**
   * Format eligibility result for display
   * @param {Object} result - Eligibility result from API
   * @returns {Object} - Formatted display data
   */
  formatEligibilityResult(result) {
    return {
      score: result.eligibility?.score || 0,
      status: result.eligibility?.status || 'unknown',
      summary: result.eligibility?.summary || '',
      rateRange: result.eligibility?.rateRange || 'N/A',
      coverage: result.eligibility?.coverage || 'N/A',
      tips: result.eligibility?.recommendations || [],
      loanOffers: result.recommendations || null,
      ratio: result.eligibility?.ratio || 0,
    };
  },

  /**
   * Format SOP analysis result for display
   * @param {Object} result - SOP analysis result from API
   * @returns {Object} - Formatted display data
   */
  formatSOPResult(result) {
    const raw = result || {};

    // Backend returns categories as an array; UI expects an object keyed by category.
    // Convert each category score to a percentage based on its max score.
    const maxByName = {
      'Clarity': 20,
      'Financial Justification': 20,
      'Career ROI': 20,
      'Originality': 20,
      'Structure': 20,
    };

    const categoriesObject = {};
    if (Array.isArray(raw.categories)) {
      for (const category of raw.categories) {
        const name = category?.name;
        const score = Number(category?.score ?? 0);
        const maxScore = Number(maxByName[name] ?? 20);
        const pct = maxScore > 0 ? Math.max(0, Math.min(100, (score / maxScore) * 100)) : 0;

        if (name === 'Clarity') categoriesObject.clarity = pct;
        else if (name === 'Financial Justification') categoriesObject.financialJustification = pct;
        else if (name === 'Career ROI') categoriesObject.careerROI = pct;
        else if (name === 'Originality') categoriesObject.originality = pct;
        else if (name === 'Structure') categoriesObject.structure = pct;
      }
    }

    const weakAreas = Array.isArray(raw.weakAreas)
      ? raw.weakAreas.map((area) => {
        if (!area) return '';
        if (typeof area === 'string') return area;
        const issue = area.issue ? String(area.issue) : 'Issue';
        const recommendation = area.recommendation ? String(area.recommendation) : '';
        return recommendation ? `${issue}: ${recommendation}` : issue;
      }).filter(Boolean)
      : [];

    const qualityMap = {
      'needs-work': 'poor',
    };

    return {
      score: Number(raw.totalScore ?? raw.score ?? 0),
      quality: qualityMap[raw.quality] || raw.qualityLevel || raw.quality || 'unknown',
      humanizeScore: Number(raw.humanizeScore ?? 0),
      humanizeFeedback: raw.humanizeFeedback || '',
      plagiarismScore: Number(raw.plagiarismScore ?? 0),
      plagiarismFeedback: raw.plagiarismFeedback || '',
      categories: Object.keys(categoriesObject).length ? categoriesObject : (raw.categories || {}),
      weakAreas,
      actionableSummary: raw.actionableSummary || raw.summary || '',
    };
  },
};
