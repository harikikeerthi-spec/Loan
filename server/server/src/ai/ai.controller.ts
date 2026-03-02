import { Controller, Post, Body, BadRequestException, Get, Param } from '@nestjs/common';
import { EligibilityService } from './services/eligibility.service';
import { LoanRecommendationService } from './services/loan-recommendation.service';
import { SopAnalysisService } from './services/sop-analysis.service';
import { GradeConversionService } from './services/grade-conversion.service';
import { UniversityComparisonService } from './services/university-comparison.service';
import { AdmitPredictorService } from './services/admit-predictor.service';
import { GroqService } from './services/groq.service';
import { UniversitySearchService, University, UniversityDetails } from './services/university-search.service';
import { VisaInterviewService, InterviewMessage, EvaluationResult } from './services/visa-interview.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly loanRecommendationService: LoanRecommendationService,
    private readonly sopAnalysisService: SopAnalysisService,
    private readonly gradeConversionService: GradeConversionService,
    private readonly universityComparisonService: UniversityComparisonService,
    private readonly admitPredictorService: AdmitPredictorService,
    private readonly groqService: GroqService,
    private readonly universitySearchService: UniversitySearchService,
    private readonly visaInterviewService: VisaInterviewService,
  ) { }

  @Post('eligibility-check')
  async checkEligibility(
    @Body()
    data: any,
  ) {
    const eligibilityResult = await this.eligibilityService.calculateEligibilityScore(data);

    const loanRecommendations = await this.loanRecommendationService.recommendLoans(
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
    const result = await this.sopAnalysisService.analyzeSop(sopText);
    return {
      success: true,
      analysis: result,
    };
  }

  @Post('humanize-sop')
  async humanizeSop(
    @Body()
    data: {
      text: string;
    },
  ) {
    const result = await this.sopAnalysisService.humanizeSop(data.text);
    return {
      success: true,
      ...result,
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
    // Validate marks if provided and compute overall percentage safely
    const marks = data.marks || [];
    const totalPerSubject = data.totalMarks || 100;

    if (marks.length > 0) {
      for (const m of marks) {
        if (typeof m !== 'number' || isNaN(m) || m < 0 || m > totalPerSubject) {
          throw new BadRequestException(`Each mark must be a number between 0 and ${totalPerSubject}`);
        }
      }
    }

    const percentage = marks.length
      ? (marks.reduce((a, b) => a + b, 0) / (marks.length * totalPerSubject)) * 100
      : (data.percentage ?? 0);

    const result = await this.gradeConversionService.convertGrade({
      inputType: 'percentage',
      inputValue: percentage,
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
          outOf: totalPerSubject,
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
    const result = await this.gradeConversionService.comparePerformance(data.assessments);
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
      program1?: string;
      program2?: string;
    },
  ) {
    const result = await this.universityComparisonService.compare(
      data.uni1,
      data.uni2,
      data.program1,
      data.program2
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('compare-shortlist')
  async compareShortlist(
    @Body()
    data: {
      shortlist: Array<{ name: string; course: string }>;
      profile: { bachelors?: string; workExp?: string; gpa?: string };
    },
  ) {
    const result = await this.universityComparisonService.compareShortlist(
      data.shortlist,
      data.profile
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('predict-admission')
  async predictAdmission(@Body() body: any) {
    const result = await this.admitPredictorService.predict(body);
    return {
      success: true,
      prediction: result
    };
  }

  @Post('check-relevance')
  async checkRelevance(@Body() data: { topic?: string; title?: string; content: string }) {
    const topicContext = data.topic || data.title || 'General Discussion';
    const contentToVerify = data.content || data.title || '';

    const prompt = `You are an AI moderator for a student community focused on international education and loans.
    Your goal is to allow any content that is HELPFUL, RELEVANT, or RELATED to the following topics:
    - Education Loans (Eligibility, Application, Benefits, Interest Rates, etc.)
    - Study Abroad (Planning, Countries, Universities, Life as a student)
    - Admission processes and Standardized Tests (GRE/IELTS/TOEFL)
    - Visa processes and immigration
    - Scholarships and Financial Aid
    - Career discussions for students

    Context: "${topicContext}"
    Title/Content: "${contentToVerify}"

    Does this content belong in an education/loan community? (Be inclusive of general questions about how things work or how they help).

    Respond with strictly valid JSON:
    {
       "relevant": boolean,
       "reason": "Short explanation if rejected (optional)"
    }`;

    try {
      const result = await this.groqService.getJson<{ relevant: boolean; reason?: string }>(prompt);
      return {
        success: true,
        relevant: result.relevant,
        isRelevant: result.relevant,
        reason: result.reason
      };
    } catch (error) {
      console.error("AI Check Failed", error);
      // Fail permissive if AI is down
      return { success: true, relevant: true, isRelevant: true, reason: "AI Check Skipped due to error" };
    }
  }

  @Post('search')
  async search(@Body() data: any) {
    try {
      const type = data.type || 'university';
      const query = data.query || '';
      const country = data.country || data.context?.country;
      const course = data.course || data.context?.course;

      console.log(`AI Search requested: type=${type}, query="${query}", country=${country}`);

      // Case 1: Fetching top universities for a country (Initial load in onboarding)
      if (type === 'university' && !query && country) {
        const universities = await this.universitySearchService.searchUniversitiesByCountry([country], 12);
        return { success: true, universities };
      }

      // Case 2: General advice/search for universities or courses
      const results = await this.groqService.searchAdvice(query, type, data.context || data);

      if (type === 'university') {
        return { success: true, universities: results };
      }

      return { success: true, results };
    } catch (error) {
      console.error("AI Unified Search Failed", error);
      return { success: false, message: "Search failed", results: [], universities: [] };
    }
  }

  @Post('search-advice')
  async searchAdvice(@Body() data: { query: string; type: 'university' | 'course'; context?: any }) {
    try {
      const results = await this.groqService.searchAdvice(data.query, data.type, data.context);
      return { success: true, results };
    } catch (error) {
      console.error("AI Search Failed", error);
      return { success: false, message: "Search failed", results: [] };
    }
  }

  @Post('suggest-tags')
  async suggestTags(@Body() data: { title: string }) {
    const prompt = `Based on the following forum post title, suggest up to 5 relevant tags that would help categorize this post in a student education and loan community. Focus on specific topics like universities, loans, visas, tests, etc.

    Title: "${data.title}"

    Respond with strictly valid JSON:
    {
       "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }`;

    try {
      const result = await this.groqService.getJson<{ tags: string[] }>(prompt);
      return { success: true, tags: result.tags || [] };
    } catch (error) {
      console.error("AI Tag Suggestion Failed", error);
      return { success: false, tags: ['education', 'loan'] };
    }
  }

  @Post('search-universities')
  async searchUniversities(
    @Body()
    data: {
      countries: string[];
      limit?: number;
    },
  ): Promise<{ success: boolean; universities: University[]; totalCount: number; source: string; message?: string }> {
    try {
      if (!data.countries || data.countries.length === 0) {
        throw new BadRequestException('At least one country is required');
      }

      const universities = await this.universitySearchService.searchUniversitiesByCountry(
        data.countries,
        data.limit || 10,
      );

      const validUniversities = await this.universitySearchService.validateUniversityRealness(universities);

      return {
        success: true,
        universities: validUniversities,
        totalCount: validUniversities.length,
        source: 'ai',
      };
    } catch (error) {
      console.error('University search failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to search universities',
        universities: [],
        totalCount: 0,
        source: 'ai',
      };
    }
  }

  @Get('university-details/:name/:country')
  async getUniversityDetails(
    @Param('name') name: string,
    @Param('country') country: string,
  ): Promise<{ success: boolean; details?: UniversityDetails | null; message?: string }> {
    try {
      if (!name || !country) {
        throw new BadRequestException('University name and country are required');
      }

      const details = await this.universitySearchService.getUniversityDetailsFull(name, country);

      return {
        success: true,
        details,
      };
    } catch (error) {
      console.error('Failed to fetch university details:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch university details',
        details: null,
      };
    }
  }

  @Get('popular-countries')
  async getPopularCountries() {
    try {
      const countries = await this.universitySearchService.getPopularCountries();
      return {
        success: true,
        countries,
      };
    } catch (error) {
      console.error('Failed to fetch popular countries:', error);
      return {
        success: false,
        message: 'Failed to fetch popular countries',
        countries: [],
      };
    }
  }

  // ── Visa Interview Simulator Endpoints ──

  @Post('visa-interview/start')
  async startVisaInterview(
    @Body() data: { userProfile: Record<string, any>; visaType?: string },
  ) {
    try {
      const question = await this.visaInterviewService.startInterview(
        data.userProfile || {},
        data.visaType || 'F1 Student Visa',
      );
      return {
        success: true,
        question,
        currentSection: 'purpose',
        sections: this.visaInterviewService.getSections(),
      };
    } catch (error) {
      console.error('Visa interview start failed:', error);
      return { success: false, message: error.message || 'Failed to start interview' };
    }
  }

  @Post('visa-interview/continue')
  async continueVisaInterview(
    @Body()
    data: {
      userProfile: Record<string, any>;
      visaType?: string;
      previousQuestion: string;
      transcript: string;
      currentSection: string;
      conversationHistory?: InterviewMessage[];
    },
  ) {
    try {
      const question = await this.visaInterviewService.continueInterview(
        data.userProfile || {},
        data.visaType || 'F1 Student Visa',
        data.previousQuestion,
        data.transcript,
        data.currentSection,
        data.conversationHistory || [],
      );
      return {
        success: true,
        question,
      };
    } catch (error) {
      console.error('Visa interview continue failed:', error);
      return { success: false, message: error.message || 'Failed to continue interview' };
    }
  }

  @Post('visa-interview/evaluate')
  async evaluateVisaAnswer(
    @Body()
    data: {
      visaType?: string;
      question: string;
      transcript: string;
    },
  ) {
    try {
      const evaluation = await this.visaInterviewService.evaluateAnswer(
        data.visaType || 'F1 Student Visa',
        data.question,
        data.transcript,
      );
      return { success: true, evaluation };
    } catch (error) {
      console.error('Visa answer evaluation failed:', error);
      return { success: false, message: error.message || 'Failed to evaluate answer' };
    }
  }

  @Post('visa-interview/final-report')
  async getVisaFinalReport(
    @Body()
    data: {
      visaType?: string;
      conversationHistory: InterviewMessage[];
      evaluations: EvaluationResult[];
    },
  ) {
    try {
      const report = await this.visaInterviewService.generateFinalReport(
        data.visaType || 'F1 Student Visa',
        data.conversationHistory || [],
        data.evaluations || [],
      );
      return { success: true, report };
    } catch (error) {
      console.error('Final report generation failed:', error);
      return { success: false, message: error.message || 'Failed to generate report' };
    }
  }
}

