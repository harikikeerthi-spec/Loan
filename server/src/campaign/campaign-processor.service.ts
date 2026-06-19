import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class CampaignProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignProcessorService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.logger.log('Campaign Processor Service initialized. Starting bulk email cron (10 emails/30s)...');
    // Run the processor every 30 seconds
    this.intervalId = setInterval(() => {
      this.processQueuedEmails().catch(err => {
        this.logger.error('Error during campaign batch processing:', err);
      });
    }, 30000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Campaign Processor Service stopped.');
    }
  }

  async processQueuedEmails() {
    if (this.isProcessing) {
      this.logger.warn('Previous batch processing is still in progress. Skipping this tick.');
      return;
    }

    this.isProcessing = true;
    try {
      // 1. Fetch campaigns that are queued or currently sending
      const { data: activeCampaigns, error: campError } = await this.supabase
        .from('EmailCampaign')
        .select('*')
        .in('status', ['queued', 'sending'])
        .lte('scheduledAt', new Date().toISOString());

      if (campError || !activeCampaigns || activeCampaigns.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Found ${activeCampaigns.length} active campaigns. Processing next batch of 10...`);

      // 2. Fetch the next 10 pending recipients across all active campaigns (prioritizing high/medium priority)
      // Since we want to send 10 emails per batch total across the system
      const campaignIds = activeCampaigns.map(c => c.id);

      const { data: pendingRecipients, error: recError } = await this.supabase
        .from('CampaignRecipient')
        .select('*')
        .in('campaignId', campaignIds)
        .eq('status', 'pending')
        .limit(10);

      if (recError) {
        this.logger.error('Failed to query pending recipients:', recError.message);
        this.isProcessing = false;
        return;
      }

      // If no pending recipients are left, we should check if campaigns are finished
      if (!pendingRecipients || pendingRecipients.length === 0) {
        await this.checkAndFinalizeCampaigns(campaignIds);
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Processing ${pendingRecipients.length} emails in this batch...`);

      // 3. Process each recipient in the batch
      for (const recipient of pendingRecipients) {
        const campaign = activeCampaigns.find(c => c.id === recipient.campaignId);
        if (!campaign) continue;

        // If campaign was in 'queued' state, transition to 'sending'
        if (campaign.status === 'queued') {
          await this.supabase
            .from('EmailCampaign')
            .update({ status: 'sending', updatedAt: new Date().toISOString() })
            .eq('id', campaign.id);
          campaign.status = 'sending';
        }

        const variables = recipient.variables || {};
        // Compile subject and body templates
        const compiledSubject = this.replacePlaceholders(campaign.subject, variables);
        const compiledBody = this.replacePlaceholders(campaign.bodyTemplate, variables);
        const textFallback = `Dear ${recipient.recipientName},\n\nPlease read this email in an HTML-enabled client.`;

        try {
          this.logger.log(`Sending campaign email to ${recipient.recipientEmail} (${recipient.recipientName})...`);
          
          // Send mail
          await this.emailService.sendMail(
            recipient.recipientEmail,
            compiledSubject,
            compiledBody,
            textFallback
          );

          // Update recipient to sent
          await this.supabase
            .from('CampaignRecipient')
            .update({
              status: 'sent',
              sentAt: new Date().toISOString(),
            })
            .eq('id', recipient.id);

          // Increment sent count
          await this.incrementCampaignCounter(campaign.id, 'sentCount');
        } catch (sendError: any) {
          this.logger.error(`Failed to send email to ${recipient.recipientEmail}: ${sendError.message}`);

          // Update recipient to failed
          await this.supabase
            .from('CampaignRecipient')
            .update({
              status: 'failed',
              errorMessage: sendError.message || 'Unknown SMTP error',
              sentAt: new Date().toISOString(),
            })
            .eq('id', recipient.id);

          // Increment failed count
          await this.incrementCampaignCounter(campaign.id, 'failedCount');
        }
      }

      // Check if campaigns have completed
      await this.checkAndFinalizeCampaigns(campaignIds);

    } catch (error) {
      this.logger.error('Unhandled error in processQueuedEmails:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async checkAndFinalizeCampaigns(campaignIds: string[]) {
    for (const campaignId of campaignIds) {
      // Check if there are any remaining pending recipients for this campaign
      const { count, error } = await this.supabase
        .from('CampaignRecipient')
        .select('*', { count: 'exact', head: true })
        .eq('campaignId', campaignId)
        .eq('status', 'pending');

      if (!error && count === 0) {
        this.logger.log(`Campaign ${campaignId} has no pending recipients left. Marking as completed.`);
        await this.supabase
          .from('EmailCampaign')
          .update({
            status: 'completed',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', campaignId);
      }
    }
  }

  private async incrementCampaignCounter(campaignId: string, counterField: 'sentCount' | 'failedCount') {
    // Fetch current counters
    const { data: campaign } = await this.supabase
      .from('EmailCampaign')
      .select('sentCount, failedCount')
      .eq('id', campaignId)
      .single();

    if (campaign) {
      const updateData: any = {};
      updateData[counterField] = (campaign[counterField] || 0) + 1;
      updateData.updatedAt = new Date().toISOString();

      await this.supabase
        .from('EmailCampaign')
        .update(updateData)
        .eq('id', campaignId);
    }
  }

  private replacePlaceholders(template: string, variables: Record<string, string>): string {
    if (!template) return '';
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }
}
