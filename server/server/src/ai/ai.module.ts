import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { EligibilityService } from './services/eligibility.service';
import { LoanRecommendationService } from './services/loan-recommendation.service';
import { SopAnalysisService } from './services/sop-analysis.service';
import { GradeConversionService } from './services/grade-conversion.service';

@Module({
  controllers: [AiController],
  providers: [
    EligibilityService,
    LoanRecommendationService,
    SopAnalysisService,
    GradeConversionService,
  ],
  exports: [
    EligibilityService,
    LoanRecommendationService,
    SopAnalysisService,
    GradeConversionService,
  ],
})
export class AiModule {}
