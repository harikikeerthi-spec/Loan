import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { EligibilityService } from './services/eligibility.service';
import { LoanRecommendationService } from './services/loan-recommendation.service';
import { SopAnalysisService } from './services/sop-analysis.service';
import { GradeConversionService } from './services/grade-conversion.service';
import { UniversityComparisonService } from './services/university-comparison.service';
import { AdmitPredictorService } from './services/admit-predictor.service';
import { DocumentVerificationService } from './services/document-verification.service';
import { GroqService } from './services/groq.service';
import { UniversitySearchService } from './services/university-search.service';
import { VisaInterviewService } from './services/visa-interview.service';

@Module({
  controllers: [AiController],
  providers: [
    GroqService,
    EligibilityService,
    LoanRecommendationService,
    SopAnalysisService,
    GradeConversionService,
    UniversityComparisonService,
    AdmitPredictorService,
    DocumentVerificationService,
    UniversitySearchService,
    VisaInterviewService,
  ],
  exports: [
    GroqService,
    EligibilityService,
    LoanRecommendationService,
    SopAnalysisService,
    GradeConversionService,
    UniversityComparisonService,
    AdmitPredictorService,
    DocumentVerificationService,
    UniversitySearchService,
    VisaInterviewService,
  ],
})
export class AiModule { }
