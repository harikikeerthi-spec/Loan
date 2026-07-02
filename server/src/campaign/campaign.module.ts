import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignProcessorService } from './campaign-processor.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignProcessorService],
  exports: [CampaignService],
})
export class CampaignModule { }
