import { Controller, Post, Body } from '@nestjs/common';
import { EligibilityService } from './services/eligibility.service';
import { LoanRecommendationService } from './services/loan-recommendation.service';
import { SopAnalysisService } from './services/sop-analysis.service';
import { GradeConversionService } from './services/grade-conversion.service';
import { UniversityComparisonService } from './services/university-comparison.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly loanRecommendationService: LoanRecommendationService,
    private readonly sopAnalysisService: SopAnalysisService,
    private readonly gradeConversionService: GradeConversionService,
    private readonly universityComparisonService: UniversityComparisonService,
  ) { }

  @Post('eligibility-check')
  async checkEligibility(
    @Body()
    data: {
      age: number;
      credit: number;
      income: number;
      loan: number;
      employment: 'employed' | 'self' | 'student' | 'unemployed';
      study: 'undergrad' | 'masters' | 'doctoral' | 'diploma';
      coApplicant: 'yes' | 'no';
      collateral: 'yes' | 'no';
    },
  ) {
    const eligibilityResult = this.eligibilityService.calculateEligibilityScore(data);

    const loanRecommendations = this.loanRecommendationService.recommendLoans(
      eligibilityResult.score,
      data.credit,
      eligibilityResult.ratio,
      data.loan,
      data.coApplicant,
      data.collateral,
      data.study,
    );

    return {
      success: true,
      eligibility: eligibilityResult,
      recommendations: loanRecommendations,
    };
  }

  @Post('sop-analysis')
  async analyzeSop(
    @Body()
    data: {
      text?: string;
      sop?: string;
    },
  ) {
    const sopText = data.text || data.sop || '';
    const result = this.sopAnalysisService.analyzeSop(sopText);
    return {
      success: true,
      analysis: result,
    };
  }

  @Post('convert-grades')
  async convertGrades(
    @Body()
    data: {
      inputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa' | 'marks';
      inputValue: string | number;
      totalMarks?: number;
      outputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa';
      gradingSystem?: 'US' | 'UK' | 'India' | 'Canada' | 'Australia';
    },
  ): Promise<any> {
    const result = this.gradeConversionService.convertGrade(data);
    return {
      success: true,
      gradeConversion: result,
    };
  }

  @Post('analyze-grades')
  async analyzeGrades(
    @Body()
    data: {
      marks?: number[];
      subjects?: string[];
      totalMarks?: number;
      gpa?: number;
      percentage?: number;
    },
  ): Promise<any> {
    const result = this.gradeConversionService.convertGrade({
      inputType: data.percentage ? 'percentage' : 'marks',
      inputValue: data.percentage || data.marks?.reduce((a, b) => a + b, 0) || 0,
      totalMarks: data.totalMarks || 100,
      outputType: 'percentage',
    });

    // Enhanced analysis with marks breakdown
    const analysisData = {
      percentage: result.percentage,
      letterGrade: result.letterGrade,
      classification: result.classification,
      internationalEquivalent: result.internationalEquivalent,
      analysis: result.analysis,
      marksBreakdown: data.subjects
        ? data.subjects.map((subject, index) => ({
          subject,
          marks: data.marks?.[index] || 0,
          outOf: (data.totalMarks || 100) / (data.marks?.length || 1),
        }))
        : null,
    };

    return {
      success: true,
      gradeAnalysis: analysisData,
    };
  }

  @Post('compare-grades')
  async compareGrades(
    @Body()
    data: {
      assessments: Array<{
        name: string;
        percentage: number;
      }>;
    },
  ): Promise<any> {
    const result = this.gradeConversionService.comparePerformance(data.assessments);
    return {
      success: true,
      comparison: result,
    };
  }

  @Post('compare-universities')
  async compareUniversities(
    @Body()
    data: {
      uni1: string;
      uni2: string;
    },
  ) {
    const result = this.universityComparisonService.compare(data.uni1, data.uni2);
    return {
      success: true,
      data: result,
    };
  }
}

