import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { CampaignService } from './campaign.service';

@Processor('campaign')
@Injectable()
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(private readonly campaignService: CampaignService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[BullMQ Worker] Processing job ${job.id} (name: ${job.name})`);
    
    switch (job.name) {
      case 'send-personal-email': {
        const { campaignId, recipientId } = job.data;
        if (!campaignId || !recipientId) {
          throw new Error('Missing campaignId or recipientId in job payload.');
        }
        return await this.campaignService.processRecipientEmail(campaignId, recipientId);
      }
      
      case 'trigger-automation': {
        const { event, userId, context } = job.data;
        return await this.campaignService.handleAutomationTrigger(event, userId, context);
      }
      
      default:
        throw new Error(`Unsupported job type: ${job.name}`);
    }
  }
}
