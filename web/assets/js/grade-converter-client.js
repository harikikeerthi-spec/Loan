/**
 * Grade Converter AI Client
 * Frontend integration for grade conversion and analysis
 */

class GradeConverterClient {
  constructor(baseURL = 'http://localhost:3000/ai') {
    this.baseURL = baseURL;
  }

  /**
   * Convert grades/marks to percentage
   */
  async convertGrades(data) {
    try {
      const response = await fetch(`${this.baseURL}/convert-grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.gradeConversion;
    } catch (error) {
      console.error('Grade conversion error:', error);
      throw error;
    }
  }

  /**
   * Analyze marks with AI insights
   */
  async analyzeGrades(data) {
    try {
      const response = await fetch(`${this.baseURL}/analyze-grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.gradeAnalysis;
    } catch (error) {
      console.error('Grade analysis error:', error);
      throw error;
    }
  }

  /**
   * Compare performance across multiple assessments
   */
  async compareGrades(assessments) {
    try {
      const response = await fetch(`${this.baseURL}/compare-grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ assessments }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.comparison;
    } catch (error) {
      console.error('Grade comparison error:', error);
      throw error;
    }
  }

  /**
   * Convert marks to percentage (simple utility)
   */
  marksToPercentage(marks, totalMarks = 100) {
    return (marks / totalMarks) * 100;
  }

  /**
   * Convert GPA to percentage (4.0 scale)
   */
  gpaToPercentage(gpa, scale = 4.0) {
    return (gpa / scale) * 100;
  }

  /**
   * Get grade from percentage
   */
  getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A+ (Outstanding)';
    if (percentage >= 85) return 'A (Excellent)';
    if (percentage >= 80) return 'B+ (Very Good)';
    if (percentage >= 75) return 'B (Good)';
    if (percentage >= 70) return 'C+ (Satisfactory)';
    if (percentage >= 65) return 'C (Average)';
    if (percentage >= 60) return 'D+ (Below Average)';
    if (percentage >= 55) return 'D (Poor)';
    return 'F (Fail)';
  }
}

// Initialize client globally
const gradeConverter = new GradeConverterClient();
