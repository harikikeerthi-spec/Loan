import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
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

import { AiSearchController } from './ai-search.controller';

@Module({
  imports: [AuthModule, SiteSettingsModule, forwardRef(() => ChatModule)],
  controllers: [AiController, AiSearchController],
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
