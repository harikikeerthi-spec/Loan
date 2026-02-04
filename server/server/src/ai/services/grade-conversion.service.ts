import { Injectable } from '@nestjs/common';

interface GradeConversionInput {
  inputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa' | 'marks';
  inputValue: string | number;
  totalMarks?: number; // For marks conversion
  outputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa';
  gradingSystem?: 'US' | 'UK' | 'India' | 'Canada' | 'Australia';
}

interface GradeConversionResult {
  inputGrade: string;
  outputGrade: string;
  percentage: number;
  gpa: number;
  cgpa: number;
  letterGrade: string;
  classification: string;
  internationalEquivalent: {
    US: string;
    UK: string;
    India: string;
  };
  analysis: {
    strength: string;
    competitiveness: string;
    recommendations: string[];
  };
}

@Injectable()
export class GradeConversionService {
  convertGrade(input: GradeConversionInput): GradeConversionResult {
    // First, normalize everything to percentage
    const percentage = this.normalizeToPercentage(input);
    
    // Calculate all grade formats
    const gpa = this.percentageToGPA(percentage);
    const cgpa = this.percentageToCGPA(percentage);
    const letterGrade = this.percentageToLetterGrade(percentage);
    const classification = this.getClassification(percentage);
    
    // Get international equivalents
    const internationalEquivalent = this.getInternationalEquivalents(percentage);
    
    // Generate AI analysis
    const analysis = this.generateAnalysis(percentage, input.gradingSystem);
    
    // Format output based on requested type
    const outputGrade = this.formatOutput(input.outputType, percentage, gpa, cgpa, letterGrade);
    
    return {
      inputGrade: this.formatInput(input),
      outputGrade,
      percentage: Math.round(percentage * 100) / 100,
      gpa: Math.round(gpa * 100) / 100,
      cgpa: Math.round(cgpa * 100) / 100,
      letterGrade,
      classification,
      internationalEquivalent,
      analysis,
    };
  }

  private normalizeToPercentage(input: GradeConversionInput): number {
    switch (input.inputType) {
      case 'percentage':
        return Number(input.inputValue);
      
      case 'marks':
        if (!input.totalMarks) return 0;
        return (Number(input.inputValue) / input.totalMarks) * 100;
      
      case 'gpa':
        // GPA is typically out of 4.0
        return (Number(input.inputValue) / 4.0) * 100;
      
      case 'cgpa':
        // CGPA is typically out of 10.0
        return (Number(input.inputValue) / 10.0) * 100;
      
      case 'letterGrade':
        return this.letterGradeToPercentage(String(input.inputValue));
      
      default:
        return 0;
    }
  }

  private letterGradeToPercentage(grade: string): number {
    const gradeMap: { [key: string]: number } = {
      'A+': 97, 'A': 93, 'A-': 90,
      'B+': 87, 'B': 83, 'B-': 80,
      'C+': 77, 'C': 73, 'C-': 70,
      'D+': 67, 'D': 63, 'D-': 60,
      'F': 50,
      'O': 95, // Outstanding (India)
      'E': 90, // Excellent (India)
      'V': 70, // Very Good (India)
      'G': 60, // Good (India)
      'S': 50, // Satisfactory (India)
      'P': 40, // Pass (India)
    };
    
    return gradeMap[grade.toUpperCase()] || 0;
  }

  private percentageToGPA(percentage: number): number {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.7;
    if (percentage >= 75) return 3.3;
    if (percentage >= 70) return 3.0;
    if (percentage >= 65) return 2.7;
    if (percentage >= 60) return 2.3;
    if (percentage >= 55) return 2.0;
    if (percentage >= 50) return 1.7;
    return 1.0;
  }

  private percentageToCGPA(percentage: number): number {
    return (percentage / 10);
  }

  private percentageToLetterGrade(percentage: number): string {
    if (percentage >= 93) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 87) return 'A-';
    if (percentage >= 83) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 77) return 'B-';
    if (percentage >= 73) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 67) return 'C-';
    if (percentage >= 63) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  private getClassification(percentage: number): string {
    if (percentage >= 90) return 'First Class with Distinction';
    if (percentage >= 75) return 'First Class';
    if (percentage >= 60) return 'Second Class';
    if (percentage >= 50) return 'Third Class';
    if (percentage >= 40) return 'Pass';
    return 'Fail';
  }

  private getInternationalEquivalents(percentage: number): { US: string; UK: string; India: string } {
    return {
      US: this.percentageToLetterGrade(percentage),
      UK: this.getUKGrade(percentage),
      India: this.getIndiaGrade(percentage),
    };
  }

  private getUKGrade(percentage: number): string {
    if (percentage >= 70) return 'First Class Honours';
    if (percentage >= 60) return 'Upper Second Class (2:1)';
    if (percentage >= 50) return 'Lower Second Class (2:2)';
    if (percentage >= 40) return 'Third Class Honours';
    return 'Fail';
  }

  private getIndiaGrade(percentage: number): string {
    if (percentage >= 90) return 'O (Outstanding)';
    if (percentage >= 80) return 'A+ (Excellent)';
    if (percentage >= 70) return 'A (Very Good)';
    if (percentage >= 60) return 'B+ (Good)';
    if (percentage >= 50) return 'B (Average)';
    if (percentage >= 40) return 'C (Pass)';
    return 'F (Fail)';
  }

  private generateAnalysis(percentage: number, system?: string): {
    strength: string;
    competitiveness: string;
    recommendations: string[];
  } {
    let strength = '';
    let competitiveness = '';
    const recommendations: string[] = [];

    if (percentage >= 90) {
      strength = 'Excellent';
      competitiveness = 'Highly competitive for top universities worldwide';
      recommendations.push('Consider applying to top-tier universities (Ivy League, Russell Group)');
      recommendations.push('Eligible for merit-based scholarships');
      recommendations.push('Strong profile for competitive programs like Medicine, Engineering, Law');
    } else if (percentage >= 80) {
      strength = 'Very Good';
      competitiveness = 'Competitive for most reputed universities';
      recommendations.push('Good chances at top 50 global universities');
      recommendations.push('May qualify for partial scholarships');
      recommendations.push('Focus on strengthening extracurriculars and test scores');
    } else if (percentage >= 70) {
      strength = 'Good';
      competitiveness = 'Competitive for mid-tier universities';
      recommendations.push('Consider universities ranked 50-150 globally');
      recommendations.push('Work on improving standardized test scores (GRE/GMAT/SAT)');
      recommendations.push('Strengthen your Statement of Purpose and recommendations');
    } else if (percentage >= 60) {
      strength = 'Fair';
      competitiveness = 'May need additional qualifications';
      recommendations.push('Consider diploma or bridge programs to improve profile');
      recommendations.push('Focus on work experience and practical skills');
      recommendations.push('Look for universities with pathway programs');
    } else {
      strength = 'Needs Improvement';
      competitiveness = 'Limited options without additional qualifications';
      recommendations.push('Consider foundation or pre-university programs');
      recommendations.push('Retake courses to improve grades');
      recommendations.push('Build strong portfolio of work experience and certifications');
    }

    return { strength, competitiveness, recommendations };
  }

  private formatInput(input: GradeConversionInput): string {
    switch (input.inputType) {
      case 'marks':
        return `${input.inputValue}/${input.totalMarks} marks`;
      case 'percentage':
        return `${input.inputValue}%`;
      case 'gpa':
        return `${input.inputValue} GPA`;
      case 'cgpa':
        return `${input.inputValue} CGPA`;
      case 'letterGrade':
        return `${input.inputValue} Grade`;
      default:
        return String(input.inputValue);
    }
  }

  private formatOutput(
    outputType: string,
    percentage: number,
    gpa: number,
    cgpa: number,
    letterGrade: string,
  ): string {
    switch (outputType) {
      case 'percentage':
        return `${Math.round(percentage * 100) / 100}%`;
      case 'gpa':
        return `${Math.round(gpa * 100) / 100} GPA`;
      case 'cgpa':
        return `${Math.round(cgpa * 100) / 100} CGPA`;
      case 'letterGrade':
        return `${letterGrade} Grade`;
      default:
        return `${Math.round(percentage * 100) / 100}%`;
    }
  }

  /**
   * Compare performance across multiple assessments
   */
  comparePerformance(assessments: { name: string; percentage: number }[]): {
    trend: string;
    averagePerformance: number;
    bestPerformance: string;
    worstPerformance: string;
    progression: string;
  } {
    if (!assessments || assessments.length === 0) {
      return {
        trend: 'Insufficient data',
        averagePerformance: 0,
        bestPerformance: 'N/A',
        worstPerformance: 'N/A',
        progression: 'Unable to determine',
      };
    }

    const percentages = assessments.map((a) => a.percentage);
    const averagePerformance = percentages.reduce((a, b) => a + b, 0) / percentages.length;

    const trend = this.calculateTrend(percentages);
    const bestIndex = percentages.indexOf(Math.max(...percentages));
    const worstIndex = percentages.indexOf(Math.min(...percentages));

    const progression =
      assessments.length > 1
        ? percentages[percentages.length - 1] > percentages[0]
          ? 'Improving'
          : 'Declining'
        : 'New';

    return {
      trend,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      bestPerformance: assessments[bestIndex].name,
      worstPerformance: assessments[worstIndex].name,
      progression,
    };
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'Insufficient data';

    const diffs: number[] = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    if (avgDiff > 2) return 'Strong Upward Trend';
    if (avgDiff > 0) return 'Slight Upward Trend';
    if (avgDiff < -2) return 'Strong Downward Trend';
    if (avgDiff < 0) return 'Slight Downward Trend';
    return 'Stable Performance';
  }
}
