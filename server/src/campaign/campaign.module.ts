import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignProcessor } from './campaign.processor';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    AuthModule,
    AiModule,
    BullModule.registerQueue({
      name: 'campaign',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignProcessor],
  exports: [CampaignService, BullModule],
})
export class CampaignModule { }
