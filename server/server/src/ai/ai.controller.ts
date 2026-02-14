import { Controller, Post, Body } from '@nestjs/common';
import { EligibilityService } from './services/eligibility.service';
import { LoanRecommendationService } from './services/loan-recommendation.service';
import { SopAnalysisService } from './services/sop-analysis.service';
import { GradeConversionService } from './services/grade-conversion.service';
import { UniversityComparisonService } from './services/university-comparison.service';
import { AdmitPredictorService } from './services/admit-predictor.service';

import { AiSupportService } from './services/ai-support.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly loanRecommendationService: LoanRecommendationService,
    private readonly sopAnalysisService: SopAnalysisService,
    private readonly gradeConversionService: GradeConversionService,
    private readonly universityComparisonService: UniversityComparisonService,
    private readonly admitPredictorService: AdmitPredictorService,
    private readonly aiSupportService: AiSupportService,
  ) {}

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
      maritalStatus: 'single' | 'married';
      coApplicant: 'yes' | 'no';
      collateral: 'yes' | 'no';
    },
  ) {
    // Await the async eligibility check
    const eligibilityResult =
      await this.eligibilityService.calculateEligibilityScore(data);

    // Note: LoanRecommendationService is still synchronous/local logic for now vs LLM,
    // but the controller doesn't need to change for that unless we refactor it too.
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
      sop: string;
    },
  ) {
    console.log('Analyzing SOP:', data.sop?.substring(0, 50) + '...');
    try {
      const result = await this.sopAnalysisService.analyzeSop(data.sop);
      return {
        success: true,
        analysis: result,
      };
    } catch (error) {
      console.error('SOP Analysis Error:', error);
      throw error;
    }
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
    const result = await this.gradeConversionService.convertGrade(data);
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
    // Construct the input for conversion service
    const result = await this.gradeConversionService.convertGrade({
      inputType: data.percentage ? 'percentage' : 'marks',
      inputValue:
        data.percentage || data.marks?.reduce((a, b) => a + b, 0) || 0,
      totalMarks: data.totalMarks || 100,
      outputType: 'percentage',
      // gradingSystem: 'Standard', // Default (Removed to fix type error)
    });

    // We can reuse the result structure directly or adapt it
    const analysisData = {
      percentage: result.percentage,
      letterGrade: result.letterGrade,
      classification: result.classification,
      internationalEquivalent: result.internationalEquivalent,
      analysis: result.analysis,
      // Pass through marks breakdown if available
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
    const result = await this.gradeConversionService.comparePerformance(
      data.assessments,
    );
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
    const result = await this.universityComparisonService.compare(
      data.uni1,
      data.uni2,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('predict-admission')
  async predictAdmission(
    @Body()
    data: {
      targetUniversity: string;
      gpa: number;
      gpaScale: 4 | 10;
      testScoreType: 'GRE' | 'GMAT' | 'SAT' | 'ACT' | 'None';
      testScore: number;
      englishTestType: 'IELTS' | 'TOEFL' | 'PTE' | 'None';
      englishTestScore: number;
      experienceYears: number;
      researchPapers: number;
      programLevel: 'Undergraduate' | 'Masters' | 'PhD' | 'MBA';
    },
  ) {
    const result = await this.admitPredictorService.predict(data);
    return {
      success: true,
      prediction: result,
    };
  }

  @Post('support-chat')
  async chat(@Body() data: { message: string }) {
    const response = await this.aiSupportService.getResponse(data.message);
    return {
      success: true,
      message: response,
    };
  }
}
