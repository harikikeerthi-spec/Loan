/**
 * Enhanced University Evaluation Scoring Engine
 * Provides comprehensive evaluation of universities based on user profile and preferences
 */

export interface UserProfile {
  gpa: number;
  workExp: number;
  englishTest?: string;
  englishScore?: number;
  budget?: string;
  course: string;
  bachelors: string;
  entrance_test?: string;
  entrance_score?: number;
}

export interface University {
  name: string;
  country?: string;
  rank?: number;
  tuition?: number;
  accept?: number;
  avgjobSalary?: number;
  employment?: number;
  min_gpa?: number;
  courses?: string[];
  loc?: string;
  scholarships?: number;
}

export interface EvaluationScore {
  academic: { score: number; text: string; weight: number };
  admission: { score: number; text: string; weight: number };
  cost: { score: number; text: string; weight: number };
  courseMatch: { score: number; text: string; weight: number };
  reputation: { score: number; text: string; weight: number };
  careerProspects: { score: number; text: string; weight: number };
  overall: number;
  recommendation: string;
}

export class UniversityEvaluationEngine {
  /**
   * Calculate academic fit score based on GPA requirements
   */
  static calculateAcademicScore(userGpa: number, minUniversityGpa: number = 7.0): { score: number; text: string } {
    const gpaGap = userGpa - minUniversityGpa;

    if (gpaGap >= 1.5) {
      return { score: 95, text: "Excellent fit - Well above requirements" };
    } else if (gpaGap >= 1.0) {
      return { score: 85, text: "Strong fit - Above requirements" };
    } else if (gpaGap >= 0.5) {
      return { score: 75, text: "Good fit - Meets requirements" };
    } else if (gpaGap >= 0) {
      return { score: 65, text: "Moderate fit - Minimal margin" };
    } else if (gpaGap >= -0.5) {
      return { score: 45, text: "Challenging - Below requirements" };
    } else {
      return { score: 25, text: "Very challenging - Well below requirements" };
    }
  }

  /**
   * Calculate admission probability score based on acceptance rate
   */
  static calculateAdmissionScore(acceptanceRate: number = 30): { score: number; text: string } {
    if (acceptanceRate >= 50) {
      return { score: 90, text: "High admission probability" };
    } else if (acceptanceRate >= 30) {
      return { score: 75, text: "Moderate admission probability" };
    } else if (acceptanceRate >= 15) {
      return { score: 55, text: "Competitive admission" };
    } else if (acceptanceRate >= 5) {
      return { score: 35, text: "Highly selective" };
    } else {
      return { score: 20, text: "Extremely competitive" };
    }
  }

  /**
   * Calculate cost-benefit score based on budget and tuition
   */
  static calculateCostScore(
    userBudget: string,
    universityTuition: number = 2500000,
    averageSalary: number = 700000
  ): { score: number; text: string } {
    const tuitionThresholds: Record<string, number> = {
      below_15: 1500000,
      "15_25": 2500000,
      "25_40": 4000000,
      above_40: 999999999,
    };

    const threshold = tuitionThresholds[userBudget] || 2500000;
    const roi = averageSalary / universityTuition;

    // Check if within budget
    const withinBudget = universityTuition <= threshold;

    if (withinBudget && roi >= 3) {
      return { score: 95, text: "Excellent value - Affordable with high ROI" };
    } else if (withinBudget && roi >= 2) {
      return { score: 85, text: "Good value - Within budget with solid ROI" };
    } else if (withinBudget) {
      return { score: 75, text: "Within budget - Acceptable cost" };
    } else if (roi >= 3) {
      return { score: 65, text: "Slightly over budget but high ROI" };
    } else if (roi >= 2) {
      return { score: 50, text: "Above budget - Moderate ROI" };
    } else {
      return { score: 30, text: "Above budget - Lower ROI" };
    }
  }

  /**
   * Calculate course match score
   */
  static calculateCourseMatchScore(
    userCourse: string,
    availableCourses: string[] = [],
    universitySpecialization?: string
  ): { score: number; text: string } {
    const courseNormalized = userCourse.toLowerCase();

    // Check for direct match
    const hasDirectMatch = availableCourses.some((c) =>
      c.toLowerCase().includes(courseNormalized.split(" ").slice(-2).join(" "))
    );

    if (hasDirectMatch) {
      return { score: 95, text: "Perfect match - Specialized programme available" };
    }

    // Check for related keywords
    const keywords = courseNormalized.split(" ");
    const hasRelated = availableCourses.some((c) =>
      keywords.some((kw) => c.toLowerCase().includes(kw) && kw.length > 2)
    );

    if (hasRelated) {
      return { score: 80, text: "Strong match - Related programme" };
    }

    if (availableCourses.length > 0) {
      return { score: 60, text: "Related programmes available" };
    }

    return { score: 40, text: "No specific programme data" };
  }

  /**
   * Calculate university reputation score
   */
  static calculateReputationScore(
    ranking: number = 500,
    country?: string,
    employment?: number = 85
  ): { score: number; text: string } {
    let baseScore = 0;

    if (ranking <= 50) {
      baseScore = 95;
    } else if (ranking <= 100) {
      baseScore = 85;
    } else if (ranking <= 200) {
      baseScore = 75;
    } else if (ranking <= 500) {
      baseScore = 65;
    } else {
      baseScore = 50;
    }

    // Bonus for employment rate
    if (employment && employment >= 95) {
      baseScore = Math.min(100, baseScore + 5);
    }

    const text =
      ranking <= 50
        ? `Top-tier university (Rank #${ranking})`
        : ranking <= 200
        ? `Well-ranked (Rank #${ranking})`
        : `Reputable institution (Rank #${ranking})`;

    return { score: baseScore, text };
  }

  /**
   * Calculate career prospects score
   */
  static calculateCareerProspectsScore(
    averageSalary: number = 700000,
    employment: number = 85,
    topRecruiters?: string[]
  ): { score: number; text: string } {
    let score = 0;

    // Salary component (0-40 points)
    if (averageSalary >= 1500000) {
      score += 40;
    } else if (averageSalary >= 1200000) {
      score += 35;
    } else if (averageSalary >= 900000) {
      score += 30;
    } else if (averageSalary >= 600000) {
      score += 25;
    } else {
      score += 15;
    }

    // Employment component (0-40 points)
    if (employment >= 95) {
      score += 40;
    } else if (employment >= 90) {
      score += 35;
    } else if (employment >= 85) {
      score += 30;
    } else if (employment >= 80) {
      score += 20;
    } else {
      score += 10;
    }

    // Top recruiters bonus (0-20 points)
    if (topRecruiters && topRecruiters.length > 5) {
      score += 20;
    } else if (topRecruiters && topRecruiters.length > 0) {
      score += 10;
    }

    const text =
      score >= 95
        ? "Excellent career prospects"
        : score >= 85
        ? "Strong career outcomes"
        : score >= 70
        ? "Good employment rate"
        : "Moderate career prospects";

    return { score: Math.min(100, score), text };
  }

  /**
   * Comprehensive evaluation of a university for a user
   */
  static evaluateUniversity(
    university: University,
    profile: UserProfile
  ): EvaluationScore {
    // Calculate individual scores
    const academicScore = this.calculateAcademicScore(profile.gpa, university.min_gpa);
    const admissionScore = this.calculateAdmissionScore(university.accept);
    const costScore = this.calculateCostScore(
      profile.budget || "above_40",
      university.tuition,
      university.avgjobSalary
    );
    const courseMatchScore = this.calculateCourseMatchScore(profile.course, university.courses);
    const reputationScore = this.calculateReputationScore(
      university.rank,
      university.country,
      university.employment
    );
    const careerScore = this.calculateCareerProspectsScore(
      university.avgjobSalary,
      university.employment
    );

    // Weighted scoring
    const weights = {
      academic: 0.25,
      admission: 0.2,
      cost: 0.15,
      courseMatch: 0.15,
      reputation: 0.15,
      career: 0.1,
    };

    const overallScore =
      academicScore.score * weights.academic +
      admissionScore.score * weights.admission +
      costScore.score * weights.cost +
      courseMatchScore.score * weights.courseMatch +
      reputationScore.score * weights.reputation +
      careerScore.score * weights.career;

    // Determine recommendation
    let recommendation = "";
    if (overallScore >= 85) {
      recommendation = "🌟 Highly Recommended - Excellent match";
    } else if (overallScore >= 75) {
      recommendation = "✓ Recommended - Strong match";
    } else if (overallScore >= 65) {
      recommendation = "△ Consider - Good match";
    } else if (overallScore >= 55) {
      recommendation = "? Evaluate - Moderate match";
    } else {
      recommendation = "⚠ Challenging - Lower match";
    }

    return {
      academic: { ...academicScore, weight: weights.academic },
      admission: { ...admissionScore, weight: weights.admission },
      cost: { ...costScore, weight: weights.cost },
      courseMatch: { ...courseMatchScore, weight: weights.courseMatch },
      reputation: { ...reputationScore, weight: weights.reputation },
      careerProspects: { ...careerScore, weight: weights.career },
      overall: Math.round(overallScore),
      recommendation,
    };
  }

  /**
   * Rank multiple universities for a user
   */
  static rankUniversities(universities: University[], profile: UserProfile): Array<University & { evaluation: EvaluationScore }> {
    const evaluated = universities.map((uni) => ({
      ...uni,
      evaluation: this.evaluateUniversity(uni, profile),
    }));

    return evaluated.sort((a, b) => b.evaluation.overall - a.evaluation.overall);
  }

  /**
   * Generate detailed recommendation summary
   */
  static generateSummary(
    rankedUniversities: Array<University & { evaluation: EvaluationScore }>,
    profile: UserProfile
  ): string {
    const topMatch = rankedUniversities[0];
    const backup = rankedUniversities[1];

    if (!topMatch) return "";

    return `Based on your profile (${profile.gpa} GPA, ${profile.workExp} months experience, applying for ${profile.course}), 
    **${topMatch.name}** is your best match with an overall evaluation score of **${topMatch.evaluation.overall}%**. 
    
    Key strengths: ${topMatch.evaluation.academic.text.toLowerCase()}, ${topMatch.evaluation.admission.text.toLowerCase()}. 
    
    We recommend ${backup ? `also applying to **${backup.name}** as a strong backup option` : "preparing a solid SOP and application materials"}.`;
  }
}
