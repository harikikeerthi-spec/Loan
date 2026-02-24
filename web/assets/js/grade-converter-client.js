/**
 * Grade Converter AI Client
 * Frontend integration for grade conversion and analysis
 */

class GradeConverterClient {
  constructor(baseURL = 'http://localhost:3000/api/ai') {
    this.baseURL = baseURL;
  }

  /**
   * Convert grades/marks to percentage
   */
  async convertGrades(data) {
    // Client-side validation to catch common errors before sending to server
    if (!data || !data.inputType) {
      throw new Error('Invalid input: missing inputType');
    }

    if (data.inputType === 'percentage') {
      const val = Number(data.inputValue);
      if (isNaN(val) || val < 0 || val > 100) {
        throw new Error('Percentage must be a number between 0 and 100');
      }
    }

    if (data.inputType === 'marks') {
      const val = Number(data.inputValue);
      const total = Number(data.totalMarks ?? 100);
      if (isNaN(val) || val < 0) {
        throw new Error('Marks must be a non-negative number');
      }
      if (isNaN(total) || total <= 0) {
        throw new Error('totalMarks must be a positive number');
      }
      if (val > total) {
        throw new Error(`Marks (${val}) cannot exceed total marks (${total})`);
      }
    }

    if (data.inputType === 'gpa') {
      const val = Number(data.inputValue);
      const max = 4.0;
      if (isNaN(val) || val < 0 || val > max) {
        throw new Error(`GPA must be a number between 0 and ${max}`);
      }
    }

    if (data.inputType === 'cgpa') {
      const val = Number(data.inputValue);
      const max = 10.0;
      if (isNaN(val) || val < 0 || val > max) {
        throw new Error(`CGPA must be a number between 0 and ${max}`);
      }
    }

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
        const errText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
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
    // Client-side validation for marks array
    if (data.marks && Array.isArray(data.marks) && data.marks.length > 0) {
      const total = Number(data.totalMarks ?? 100);
      for (const m of data.marks) {
        const val = Number(m);
        if (isNaN(val) || val < 0 || val > total) {
          throw new Error(`Each mark must be a number between 0 and ${total}`);
        }
      }
    }

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
        const errText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
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
    // Validate percentages
    if (!Array.isArray(assessments) || assessments.length === 0) {
      throw new Error('Assessments must be a non-empty array');
    }
    for (const a of assessments) {
      const p = Number(a.percentage);
      if (isNaN(p) || p < 0 || p > 100) {
        throw new Error('Each assessment percentage must be between 0 and 100');
      }
    }

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
        const errText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
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
