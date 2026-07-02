import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenRouterService } from '../ai/services/openrouter.service';

@Injectable()
export class CampaignService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly openRouterService: OpenRouterService,
  ) { }

  async createCampaign(data: any) {
    const { data: campaign, error } = await this.supabase
      .from('EmailCampaign')
      .insert([{
        title: data.title,
        templateType: data.templateType,
        tone: data.tone,
        optimizationGoal: data.optimizationGoal || '',
        primaryObjective: data.primaryObjective,
        targetContext: data.targetContext || '',
        subject: data.subject,
        bodyTemplate: data.bodyTemplate,
        status: 'draft',
        priority: data.priority || 'medium',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
        totalCount: 0,
        sentCount: 0,
        failedCount: 0,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return { success: true, data: campaign };
  }

  async getCampaigns(limit = 50, offset = 0) {
    const { data, error, count } = await this.supabase
      .from('EmailCampaign')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return {
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    };
  }

  async getCampaignById(id: string) {
    const { data: campaign, error } = await this.supabase
      .from('EmailCampaign')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Also get recipient counts grouped by status
    const { data: recipients, error: recError } = await this.supabase
      .from('CampaignRecipient')
      .select('status');

    let pendingCount = 0;
    let sentCount = 0;
    let failedCount = 0;

    if (!recError && recipients) {
      const filtered = recipients.filter((r: any) => r.campaignId === id); // fallback local filter if eq not used
      // Let's do a proper DB count instead
    }

    const { count: pending } = await this.supabase
      .from('CampaignRecipient')
      .select('*', { count: 'exact', head: true })
      .eq('campaignId', id)
      .eq('status', 'pending');

    const { count: sent } = await this.supabase
      .from('CampaignRecipient')
      .select('*', { count: 'exact', head: true })
      .eq('campaignId', id)
      .eq('status', 'sent');

    const { count: failed } = await this.supabase
      .from('CampaignRecipient')
      .select('*', { count: 'exact', head: true })
      .eq('campaignId', id)
      .eq('status', 'failed');

    return {
      success: true,
      data: {
        ...campaign,
        stats: {
          pending: pending || 0,
          sent: sent || 0,
          failed: failed || 0,
        }
      },
    };
  }

  async deleteCampaign(id: string) {
    const { error } = await this.supabase
      .from('EmailCampaign')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }

    return { success: true, message: 'Campaign deleted successfully' };
  }

  async getTargetAudience(filters: any = {}) {
    let query = this.supabase.from('User').select('id, email, firstName, lastName, role');

    // Default to only target students unless specified
    query = query.eq('role', 'student');

    if (filters.studyDestination) {
      query = query.eq('studyDestination', filters.studyDestination);
    }

    if (filters.targetUniversity) {
      query = query.eq('targetUniversity', filters.targetUniversity);
    }

    const { data: users, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch audience: ${error.message}`);
    }

    return users || [];
  }

  async queueCampaign(id: string, recipientIds: string[]) {
    // 1. Fetch Campaign
    const { data: campaign, error: campError } = await this.supabase
      .from('EmailCampaign')
      .select('*')
      .eq('id', id)
      .single();

    if (campError || !campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // 2. Fetch selected users
    const { data: users, error: usersError } = await this.supabase
      .from('User')
      .select('id, email, firstName, lastName')
      .in('id', recipientIds);

    if (usersError || !users || users.length === 0) {
      throw new Error('No valid recipients selected');
    }

    console.log(`Queueing campaign ${id} for ${users.length} recipients...`);

    // 3. Clear any existing recipients for this campaign
    await this.supabase
      .from('CampaignRecipient')
      .delete()
      .eq('campaignId', id);

    // 4. Batch insert recipients
    const recipientRecords = users.map(user => ({
      campaignId: id,
      recipientEmail: user.email,
      recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      variables: {
        firstName: user.firstName || 'Student',
        lastName: user.lastName || '',
      },
      status: 'pending',
    }));

    const { error: insertError } = await this.supabase
      .from('CampaignRecipient')
      .insert(recipientRecords);

    if (insertError) {
      throw new Error(`Failed to queue recipients: ${insertError.message}`);
    }

    // 5. Update Campaign Status
    const { error: updateError } = await this.supabase
      .from('EmailCampaign')
      .update({
        status: 'queued',
        totalCount: users.length,
        sentCount: 0,
        failedCount: 0,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update campaign status: ${updateError.message}`);
    }

    return {
      success: true,
      message: 'Campaign queued successfully',
      queuedCount: users.length,
    };
  }

  async cancelCampaign(id: string) {
    const { error } = await this.supabase
      .from('EmailCampaign')
      .update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to cancel campaign: ${error.message}`);
    }

    return { success: true, message: 'Campaign cancelled successfully' };
  }

  async generateCampaignEmail(data: any) {
    const prompt = `You are an expert email marketer for VidyaLoan, an education loan platform in India.
Generate a high-converting email campaign with the following parameters:
- Template Type: ${data.templateType || 'newsletter'}
- Tone: ${data.tone || 'friendly_casual'}
- Primary Objective: ${data.primaryObjective || 'Visit our website'}
- Target Context: ${data.targetContext || ''}
- Optimization Goal: ${data.optimizationGoal || ''}

Requirements:
1. Subject line: Write a highly engaging, relevant subject line. It can include personalization like {{firstName}}.
2. HTML Body: Write a beautiful, clean, responsive HTML email body template using inline styling. Use a professional color scheme (deep indigo #6605c7, slate, white). Include a clear, styled Call-To-Action (CTA) button linked to the objective.
3. Placeholders: Use {{firstName}} and {{lastName}} inside the body where appropriate.
4. Output format: You must return a JSON object with exactly two keys: "subject" and "bodyTemplate". Do not include markdown code block syntax.`;

    try {
      const result = await this.openRouterService.getJson<{ subject: string; bodyTemplate: string }>(prompt);
      return { success: true, data: result };
    } catch (error: any) {
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async trackOpen(recipientId: string) {
    // Set openedAt if not already set
    const { data, error } = await this.supabase
      .from('CampaignRecipient')
      .update({ openedAt: new Date().toISOString() })
      .eq('id', recipientId)
      .is('openedAt', null)
      .select('campaignId')
      .single();

    if (error) {
      console.error(`[CampaignService.trackOpen] Error updating recipient ${recipientId}:`, error.message);
      return;
    }

    if (data) {
      // Increment openCount on Campaign
      const { data: campaign, error: campErr } = await this.supabase
        .from('EmailCampaign')
        .select('openCount')
        .eq('id', data.campaignId)
        .single();

      if (campaign && !campErr) {
        await this.supabase
          .from('EmailCampaign')
          .update({
            openCount: (campaign.openCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', data.campaignId);
      }
    }
  }

  async trackClick(recipientId: string) {
    // Set clickedAt if not already set
    const { data, error } = await this.supabase
      .from('CampaignRecipient')
      .update({ clickedAt: new Date().toISOString() })
      .eq('id', recipientId)
      .is('clickedAt', null)
      .select('campaignId')
      .single();

    if (error) {
      console.error(`[CampaignService.trackClick] Error updating recipient ${recipientId}:`, error.message);
      return;
    }

    if (data) {
      // Increment clickCount on Campaign
      const { data: campaign, error: campErr } = await this.supabase
        .from('EmailCampaign')
        .select('clickCount')
        .eq('id', data.campaignId)
        .single();

      if (campaign && !campErr) {
        await this.supabase
          .from('EmailCampaign')
          .update({
            clickCount: (campaign.clickCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', data.campaignId);
      }
    }
  }
}
