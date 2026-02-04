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
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
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
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('SOP analysis failed:', error);
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
      score: result.eligibilityScore?.score || 0,
      status: result.eligibilityScore?.status || 'unknown',
      summary: result.eligibilityScore?.summary || '',
      rateRange: result.eligibilityScore?.rateRange || 'N/A',
      coverage: result.eligibilityScore?.coverage || 'N/A',
      recommendations: result.recommendations || [],
      ratio: result.eligibilityScore?.ratio || 0,
    };
  },

  /**
   * Format SOP analysis result for display
   * @param {Object} result - SOP analysis result from API
   * @returns {Object} - Formatted display data
   */
  formatSOPResult(result) {
    return {
      score: result.totalScore || 0,
      quality: result.qualityLevel || 'unknown',
      categories: result.categories || {},
      weakAreas: result.weakAreas || [],
      actionableSummary: result.actionableSummary || '',
    };
  },
};
