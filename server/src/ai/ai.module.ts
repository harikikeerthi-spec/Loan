import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { EligibilityService } from './services/eligibility.service';
import { LoanRecommendationService } from './services/loan-recommendation.service';
import { SopAnalysisService } from './services/sop-analysis.service';
import { GradeConversionService } from './services/grade-conversion.service';
import { UniversityComparisonService } from './services/university-comparison.service';
import { AdmitPredictorService } from './services/admit-predictor.service';
import { DocumentVerificationService } from './services/document-verification.service';
import { ApplicationReviewService } from './services/application-review.service';
import { OpenRouterService } from './services/openrouter.service';
import { UniversitySearchService } from './services/university-search.service';
import { VisaInterviewService } from './services/visa-interview.service';
import { KycService } from './services/kyc.service';

@Module({
  imports: [AuthModule, forwardRef(() => ChatModule)],
  controllers: [AiController],
  providers: [
    OpenRouterService,
    EligibilityService,
    LoanRecommendationService,
    SopAnalysisService,
    GradeConversionService,
    UniversityComparisonService,
    AdmitPredictorService,
    DocumentVerificationService,
    ApplicationReviewService,
    UniversitySearchService,
    VisaInterviewService,
    KycService,
  ],
  exports: [
    OpenRouterService,
    EligibilityService,
    LoanRecommendationService,
    SopAnalysisService,
    GradeConversionService,
    UniversityComparisonService,
    AdmitPredictorService,
    DocumentVerificationService,
    ApplicationReviewService,
    UniversitySearchService,
    VisaInterviewService,
    KycService,
  ],
})
export class AiModule { }
