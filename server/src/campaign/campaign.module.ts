import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignProcessorService } from './campaign-processor.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignProcessorService],
  exports: [CampaignService],
})
export class CampaignModule {}
