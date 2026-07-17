import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterService } from '../ai/services/openrouter.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openRouter: OpenRouterService,
    private readonly emailService: EmailService,
  ) { }

  // ─── Campaign CRUD Operations ──────────────────────────────────────────────

  async createCampaign(data: any) {
    this.logger.log(`Creating campaign: ${data.title}`);
    const campaign = await this.prisma.campaign.create({
      data: {
        name: data.title,
        campaignType: data.templateType || 'newsletter',
        tone: data.tone || 'friendly',
        optimizationGoal: data.optimizationGoal || '',
        primaryObjective: data.primaryObjective || '',
        targetContext: data.targetContext || '',
        subject: data.subject,
        body: data.bodyTemplate || '',
        status: 'draft',
        priority: data.priority || 'medium',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
        totalCount: 0,
        sentCount: 0,
        failedCount: 0,
        openCount: 0,
        clickCount: 0,
      },
    });

    // Initialize Campaign Analytics
    await this.prisma.campaignAnalytics.create({
      data: {
        campaignId: campaign.id,
      },
    });

    return { success: true, data: campaign };
  }

  async getCampaigns(limit = 50, offset = 0, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          analytics: true,
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async getCampaignById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        analytics: true,
        aiEmails: { take: 5 },
        recipients: { take: 10 },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Get live status stats
    const [pendingCount, queuedCount, sentCount, failedCount] = await Promise.all([
      this.prisma.campaignRecipient.count({ where: { campaignId: id, status: 'pending' } }),
      this.prisma.campaignRecipient.count({ where: { campaignId: id, status: 'queued' } }),
      this.prisma.campaignRecipient.count({ where: { campaignId: id, status: 'sent' } }),
      this.prisma.campaignRecipient.count({ where: { campaignId: id, status: 'failed' } }),
    ]);

    return {
      success: true,
      data: {
        ...campaign,
        stats: {
          pending: pendingCount,
          queued: queuedCount,
          sent: sentCount,
          failed: failedCount,
        },
      },
    };
  }

  async updateCampaign(id: string, data: any) {
    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: data.title,
        campaignType: data.templateType,
        tone: data.tone,
        optimizationGoal: data.optimizationGoal,
        primaryObjective: data.primaryObjective,
        targetContext: data.targetContext,
        subject: data.subject,
        body: data.bodyTemplate,
        priority: data.priority,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        status: data.status,
      },
    });

    return { success: true, data: campaign };
  }

  async deleteCampaign(id: string) {
    await this.prisma.campaign.delete({ where: { id } });
    return { success: true, message: 'Campaign and associated logs deleted successfully' };
  }

  // ─── Audience Builder & Advanced Filters ───────────────────────────────────

  async getTargetAudience(filters: any = {}) {
    const queryConditions: any = {
      role: 'student', // only target students
    };

    // If advanced filter object is provided
    if (filters) {
      const andConditions: any[] = [];

      if (filters.studyDestination) {
        andConditions.push({ studyDestination: { equals: filters.studyDestination, mode: 'insensitive' } });
      }

      if (filters.targetUniversity) {
        andConditions.push({ targetUniversity: { contains: filters.targetUniversity, mode: 'insensitive' } });
      }

      if (filters.courseName) {
        andConditions.push({ courseName: { contains: filters.courseName, mode: 'insensitive' } });
      }

      if (filters.intakeSeason) {
        andConditions.push({ intakeSeason: { contains: filters.intakeSeason, mode: 'insensitive' } });
      }

      // Filter by Loan Application details
      if (filters.loanStatus || filters.applicationStage || filters.loanAmountMin || filters.loanAmountMax) {
        const loanWhere: any = {};
        if (filters.loanStatus) {
          loanWhere.status = filters.loanStatus;
        }
        if (filters.applicationStage) {
          loanWhere.stage = filters.applicationStage;
        }
        if (filters.loanAmountMin || filters.loanAmountMax) {
          loanWhere.amount = {};
          if (filters.loanAmountMin) loanWhere.amount.gte = parseFloat(filters.loanAmountMin);
          if (filters.loanAmountMax) loanWhere.amount.lte = parseFloat(filters.loanAmountMax);
        }

        andConditions.push({
          loanApplications: {
            some: loanWhere,
          },
        });
      }

      // Filter by missing documents
      if (filters.missingDocuments && Array.isArray(filters.missingDocuments) && filters.missingDocuments.length > 0) {
        andConditions.push({
          documents: {
            some: {
              docType: { in: filters.missingDocuments },
              uploaded: false,
            },
          },
        });
      }

      // Mobile/Email verification status
      if (filters.emailVerified !== undefined) {
        andConditions.push({ emailVerified: filters.emailVerified === 'true' || filters.emailVerified === true });
      }

      if (filters.mobileVerified !== undefined) {
        andConditions.push({ mobileVerified: filters.mobileVerified === 'true' || filters.mobileVerified === true });
      }

      // Admission Status
      if (filters.admitStatus) {
        andConditions.push({ admitStatus: filters.admitStatus });
      }

      // Risk score or AI eligibility score matches (joins)
      if (filters.minEligibilityScore) {
        andConditions.push({
          eligibilityChecks: {
            some: {
              score: { gte: parseFloat(filters.minEligibilityScore) },
            },
          },
        });
      }

      // Apply AND block if contains any conditions
      if (andConditions.length > 0) {
        queryConditions.AND = andConditions;
      }
    }

    const users = await this.prisma.user.findMany({
      where: queryConditions,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        studyDestination: true,
        targetUniversity: true,
        courseName: true,
        loanAmount: true,
        admitStatus: true,
        createdAt: true,
      },
    });

    return users;
  }

  async saveAudience(data: any) {
    const audience = await this.prisma.campaignAudience.create({
      data: {
        name: data.name,
        description: data.description,
        filters: data.filters || {},
      },
    });
    return { success: true, data: audience };
  }

  async getSavedAudiences() {
    const audiences = await this.prisma.campaignAudience.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: audiences };
  }

  // ─── Campaign Enqueuing & Scheduling ───────────────────────────────────────

  async queueCampaign(id: string, recipientIds: string[]) {
    // 1. Fetch Campaign details
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // 2. Fetch users by selected ID list
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: recipientIds },
      },
    });

    if (users.length === 0) {
      throw new BadRequestException('No valid recipients selected.');
    }

    // 3. Delete any previous queue records for this campaign
    await this.prisma.campaignRecipient.deleteMany({
      where: { campaignId: id },
    });

    // 4. Batch insert recipients
    const recipientData = users.map(u => ({
      campaignId: id,
      userId: u.id,
      recipientEmail: u.email,
      recipientName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      status: 'queued',
      variables: {
        studentName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        country: u.studyDestination || 'your study destination',
        course: u.courseName || 'your course',
        university: u.targetUniversity || 'your university',
        loanAmount: u.loanAmount || 'required amount',
        dashboardUrl: 'https://vidyaloan.com/dashboard',
      },
    }));

    await this.prisma.campaignRecipient.createMany({
      data: recipientData,
    });

    // Fetch the generated recipients to queue jobs
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId: id },
    });

    // 5. Update campaign status
    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'queued',
        totalCount: recipients.length,
        sentCount: 0,
        failedCount: 0,
        updatedAt: new Date(),
      },
    });

    // 6. Process recipients in the background asynchronously
    (async () => {
      // Transition campaign status to 'sending'
      await this.prisma.campaign.update({
        where: { id },
        data: { status: 'sending', updatedAt: new Date() },
      }).catch(e => this.logger.error(`Error updating campaign status to sending: ${e.message}`));

      for (const r of recipients) {
        try {
          await this.processRecipientEmail(id, r.id);
        } catch (err: any) {
          this.logger.error(`Error processing email for recipient ${r.id}: ${err.message}`);
        }
      }

      // Transition campaign status to 'completed'
      await this.prisma.campaign.update({
        where: { id },
        data: { status: 'completed', updatedAt: new Date() },
      }).catch(e => this.logger.error(`Error updating campaign status to completed: ${e.message}`));
    })();

    this.logger.log(`Started background processing for ${recipients.length} recipients for campaign ${campaign.name}`);

    return {
      success: true,
      message: 'Campaign recipients queued successfully',
      queuedCount: recipients.length,
    };
  }

  async cancelCampaign(id: string) {
    // Update campaign status
    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    // Update queued recipients to cancelled
    await this.prisma.campaignRecipient.updateMany({
      where: { campaignId: id, status: 'queued' },
      data: { status: 'cancelled' },
    });

    return { success: true, message: 'Campaign sending cancelled successfully' };
  }

  async sendTestEmail(campaignId: string, adminEmail: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const subject = `[TEST PREVIEW] ${campaign.subject}`;
    const body = campaign.body.replace(/{{studentName}}/g, 'Test Admin');

    await this.emailService.sendMail(adminEmail, subject, body, 'Test preview text fallback.');
    return { success: true, message: `Test email sent to ${adminEmail}` };
  }

  // ─── AI Engines: Personalization, Prompt Building & Context Building ───────

  async processRecipientEmail(campaignId: string, recipientId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.status === 'cancelled') {
      return { success: false, reason: 'Campaign cancelled or not found' };
    }

    const recipient = await this.prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
    });
    if (!recipient || recipient.status !== 'queued') {
      return { success: false, reason: 'Recipient not ready or already processed' };
    }

    // Update status to generating
    await this.prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'generating' },
    });

    try {
      // 1. Build Student Profile Context Automatically
      const studentContext = await this.buildStudentContext(recipient.userId);

      // 2. Personalize Subject & Email Body with AI
      const prompt = `
      You are an elite educational financing copywriter for VidyaLoan (India's leading study abroad loan platform).
      You are writing a personalized campaign email to:
      ${JSON.stringify(studentContext, null, 2)}

      Campaign Parameters:
      - Goal: ${campaign.optimizationGoal}
      - Objective: ${campaign.primaryObjective}
      - Tone: ${campaign.tone}
      - Template Subject: ${campaign.subject}
      - Template Body: ${campaign.body}

      Instructions:
      1. Write a highly tailored email subject. It should feel conversational yet professional, using variables like ${studentContext.firstName}.
      2. Write a highly personalized email body content based on the provided template and student's context.
         - Mention their specific target university (${studentContext.targetUniversity || 'chosen university'}) and country (${studentContext.country || 'destination country'}).
         - Refer to their current loan status (${studentContext.loanStatus}) or missing documents (${studentContext.pendingDocuments.join(', ') || 'none'}).
         - Inject helpful assistance from their assigned advisor (${studentContext.assignedStaff || 'our staff'}).
         - Maintain the tone: ${campaign.tone}.
      3. Format output as a JSON object containing keys: "subject", "previewText", "body", "ctaText", "footerText".
      4. Ensure the body contains valid, spam-safe inline HTML. Do not include markdown code block characters.
      `;

      const aiResponse = await this.openRouter.getJson<{
        subject: string;
        previewText: string;
        body: string;
        ctaText: string;
        footerText: string;
      }>(prompt);

      // 3. Save generated AI email
      const aiRecord = await this.prisma.aIEmail.create({
        data: {
          campaignId,
          subject: aiResponse.subject || campaign.subject,
          previewText: aiResponse.previewText || 'Exclusive updates for you.',
          body: aiResponse.body || campaign.body,
          cta: aiResponse.ctaText || 'Visit Portal',
          footer: aiResponse.footerText || 'VidyaLoan Tech.',
          spamScore: 1.2, // mock spam score
          confidenceScore: 94.5,
        },
      });

      // 4. Inject open and click tracking
      const trackedBody = this.injectTracking(aiRecord.body, recipientId);

      // 5. Send via SMTP
      await this.emailService.sendMail(
        recipient.recipientEmail,
        aiRecord.subject,
        trackedBody,
        `Dear ${recipient.recipientName},\n\nPlease view this email in an HTML compatible client.`,
      );

      // 6. Update recipient status and logs
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Create log record
      await this.prisma.emailLog.create({
        data: {
          campaignId,
          recipientEmail: recipient.recipientEmail,
          subject: aiRecord.subject,
          status: 'sent',
        },
      });

      // Increment campaign counters
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: { increment: 1 },
        },
      });

      // Update analytics
      await this.prisma.campaignAnalytics.update({
        where: { campaignId },
        data: {
          totalSent: { increment: 1 },
        },
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process campaign email for ${recipient.recipientEmail}: ${error.message}`);
      
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      await this.prisma.emailLog.create({
        data: {
          campaignId,
          recipientEmail: recipient.recipientEmail,
          subject: campaign.subject,
          status: 'failed',
          errorMessage: error.message,
        },
      });

      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          failedCount: { increment: 1 },
        },
      });

      await this.prisma.campaignAnalytics.update({
        where: { campaignId },
        data: {
          totalFailed: { increment: 1 },
        },
      });

      throw error; // Let BullMQ retry
    }
  }

  private async buildStudentContext(userId: string | null) {
    if (!userId) {
      return {
        firstName: 'Student',
        lastName: '',
        country: '',
        university: '',
        course: '',
        loanAmount: '',
        loanStatus: 'Applied',
        pendingDocuments: [],
        assignedStaff: 'VidyaLoan Team',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        loanApplications: { orderBy: { date: 'desc' }, take: 1 },
        documents: { where: { uploaded: false } },
      },
    });

    if (!user) {
      return {
        firstName: 'Student',
        lastName: '',
        country: '',
        university: '',
        course: '',
        loanAmount: '',
        loanStatus: 'Applied',
        pendingDocuments: [],
        assignedStaff: 'VidyaLoan Team',
      };
    }

    const latestApplication = user.loanApplications[0];
    const missingDocs = user.documents.map(d => d.docType);

    return {
      firstName: user.firstName || 'Student',
      lastName: user.lastName || '',
      country: user.studyDestination || '',
      targetUniversity: user.targetUniversity || '',
      course: user.courseName || '',
      loanAmount: user.loanAmount || '',
      loanStatus: latestApplication ? latestApplication.status : 'Prospect',
      applicationStage: latestApplication ? latestApplication.stage : 'New Lead',
      pendingDocuments: missingDocs,
      assignedStaff: 'VidyaLoan Support Team',
    };
  }

  private injectTracking(html: string, recipientId: string): string {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000/api';
    
    // Inject open tracking pixel
    const trackingPixel = `<img src="${backendUrl}/campaigns/track/open/${recipientId}" width="1" height="1" style="display:none;" />`;
    let body = html;
    if (body.includes('</body>')) {
      body = body.replace('</body>', `${trackingPixel}</body>`);
    } else {
      body = body + trackingPixel;
    }

    // Inject click tracking redirects
    const anchorRegex = /<a\s+([^>]*?)href=(["'])(https?:\/\/[^"'\s>]+)(["'])([^>]*?)>/gi;
    body = body.replace(anchorRegex, (match, before, quote1, url, quote2, after) => {
      const trackingUrl = `${backendUrl}/campaigns/track/click/${recipientId}?redirect=${encodeURIComponent(url)}`;
      return `<a ${before}href=${quote1}${trackingUrl}${quote2}${after}>`;
    });

    return body;
  }

  // ─── Tracking Webhooks ─────────────────────────────────────────────────────

  async trackOpen(recipientId: string) {
    const recipient = await this.prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
    });
    if (recipient && !recipient.openedAt) {
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { openedAt: new Date(), status: 'opened' },
      });

      await this.prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { openCount: { increment: 1 } },
      });

      await this.prisma.campaignAnalytics.update({
        where: { campaignId: recipient.campaignId },
        data: { totalOpened: { increment: 1 } },
      });
    }
  }

  async trackClick(recipientId: string) {
    const recipient = await this.prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
    });
    if (recipient && !recipient.clickedAt) {
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { clickedAt: new Date(), status: 'clicked' },
      });

      await this.prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { clickCount: { increment: 1 } },
      });

      await this.prisma.campaignAnalytics.update({
        where: { campaignId: recipient.campaignId },
        data: { totalClicked: { increment: 1 } },
      });
    }
  }

  // ─── AI Pre-send Validation Checklist ──────────────────────────────────────

  async validateCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const prompt = `
    Analyze this email subject and body template for spam risks, formatting, variable alignment, and deliverability.
    Subject: ${campaign.subject}
    Body: ${campaign.body}

    Check:
    1. Typographical issues.
    2. Grammar errors.
    3. Missing variables (like mismatched brackets).
    4. Spam triggers (heavy sales language, excessive uppercase).
    5. Mobile responsiveness hints.

    Return JSON format containing:
    - isValid: boolean
    - scores: { subjectScore: number (0-100), ctaScore: number (0-100), spamScore: number (0-10) }
    - warnings: string[] (empty if no issues found)
    `;

    const validation = await this.openRouter.getJson<{
      isValid: boolean;
      scores: { subjectScore: number; ctaScore: number; spamScore: number };
      warnings: string[];
    }>(prompt);

    return { success: true, data: validation };
  }

  // ─── AI Content Templates & Automation Rules CRUD ─────────────────────────

  async getTemplates() {
    const templates = await this.prisma.campaignTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: templates };
  }

  async createTemplate(data: any) {
    const template = await this.prisma.campaignTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        bodyTemplate: data.bodyTemplate,
        type: data.type || 'newsletter',
        tone: data.tone || 'friendly',
      },
    });
    return { success: true, data: template };
  }

  async getAutomationRules() {
    const rules = await this.prisma.automationRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rules };
  }

  async createAutomationRule(data: any) {
    const rule = await this.prisma.automationRule.create({
      data: {
        name: data.name,
        triggerEvent: data.triggerEvent,
        templateId: data.templateId,
        priority: data.priority || 'medium',
        tone: data.tone || 'friendly',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return { success: true, data: rule };
  }

  async getPromptHistory() {
    // Fetch logs of AI emails generated historically
    const prompts = await this.prisma.aIEmail.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { name: true } },
      },
    });
    return { success: true, data: prompts };
  }

  async generateCampaignEmail(data: any) {
    const prompt = `You are a professional study abroad education loan email generator.
    Draft a personalized email for standard campaigns:
    Goal: ${data.optimizationGoal || ''}
    Objective: ${data.primaryObjective || ''}
    Context: ${data.targetContext || ''}
    Tone: ${data.tone || 'friendly'}
    Length: ${data.emailLength || 'medium'}
    CTA text: ${data.cta || 'Visit Portal'}
    Language: ${data.language || 'English'}
    Brand identity: ${data.brand || 'VidyaLoan'}

    Requirements:
    1. Compose subject line.
    2. Write beautifully responsive HTML email template using basic inline styles. Include deep violet colors (#6605c7), clean text hierarchy.
    3. Include placeholders like {{studentName}} and {{loanAmount}} where appropriate.
    4. Return JSON with keys: "subject", "bodyTemplate". No markdown markup.`;

    const aiRes = await this.openRouter.getJson<{ subject: string; bodyTemplate: string }>(prompt);
    return { success: true, data: aiRes };
  }

  async handleAutomationTrigger(event: string, userId: string, context?: any) {
    this.logger.log(`Handling automation rule: ${event} for user: ${userId}`);
    const activeRules = await this.prisma.automationRule.findMany({
      where: { triggerEvent: event, isActive: true },
    });

    for (const rule of activeRules) {
      const template = await this.prisma.campaignTemplate.findUnique({
        where: { id: rule.templateId },
      });
      if (!template) continue;

      // Create an instant transactional campaign for this single automation trigger
      const campaign = await this.prisma.campaign.create({
        data: {
          name: `Automation Rule - ${rule.name} - ${userId}`,
          campaignType: template.type,
          tone: rule.tone,
          subject: template.subject,
          body: template.bodyTemplate,
          status: 'queued',
          priority: rule.priority,
          totalCount: 1,
        },
      });

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      const recipient = await this.prisma.campaignRecipient.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          recipientEmail: user.email,
          recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          status: 'queued',
          variables: {
            studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            dashboardUrl: 'https://vidyaloan.com/dashboard',
            ...context,
          },
        },
      });

      // Process in background asynchronously
      (async () => {
        // Transition campaign status to 'sending'
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'sending', updatedAt: new Date() },
        }).catch(e => this.logger.error(`Error updating campaign status to sending: ${e.message}`));

        try {
          await this.processRecipientEmail(campaign.id, recipient.id);
        } catch (err: any) {
          this.logger.error(`Error processing automated email for recipient ${recipient.id}: ${err.message}`);
        }

        // Transition campaign status to 'completed'
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'completed', updatedAt: new Date() },
        }).catch(e => this.logger.error(`Error updating campaign status to completed: ${e.message}`));
      })();
    }
  }

  // ─── Analytics Dashboard Overview ─────────────────────────────────────────

  async getOverviewStats() {
    const campaignsCount = await this.prisma.campaign.count();
    const recipientsCount = await this.prisma.campaignRecipient.count();
    const sentCount = await this.prisma.campaignRecipient.count({ where: { status: 'sent' } });
    const openedCount = await this.prisma.campaignRecipient.count({ where: { status: 'opened' } });
    const clickedCount = await this.prisma.campaignRecipient.count({ where: { status: 'clicked' } });
    const failedCount = await this.prisma.campaignRecipient.count({ where: { status: 'failed' } });

    // Open/Click conversion ratios
    const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
    const clickRate = sentCount > 0 ? Math.round((clickedCount / sentCount) * 100) : 0;

    return {
      success: true,
      data: {
        totalCampaigns: campaignsCount,
        totalRecipients: recipientsCount,
        sent: sentCount,
        opened: openedCount,
        clicked: clickedCount,
        failed: failedCount,
        openRate,
        clickRate,
      },
    };
  }
}
