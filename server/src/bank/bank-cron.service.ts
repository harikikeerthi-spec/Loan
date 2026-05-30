import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SalesforceService } from './salesforce.service';
import { BankSchemesService } from './bank-schemes.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class BankCronService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly salesforce: SalesforceService,
    private readonly schemesService: BankSchemesService,
    private readonly emailService: EmailService
  ) {}

  private get db() {
    return this.supabase.getClient();
  }

  /**
   * Daily Cron task running at midnight to check for expired sanctions (> 30 days).
   * Maps to: '0 0 * * *'
   * Task 18 — F11: auto-lapse at 30 days
   */
  async checkSanctionExpiries(): Promise<void> {
    console.log('[Cron: ExpiryCheck] Scanning for inactive sanctions older than 30 days...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find applications in sanction stage that haven't been advanced in 30+ days
      const { data: activeSanctions, error } = await this.db
        .from('LoanApplication')
        .select('id, applicationNumber, status, bank, amount, firstName, lastName, updatedAt')
        .in('status', ['approved', 'sanctioned', 'conditional_sanction', 'partial_sanction', 'counter_offer'])
        .lt('updatedAt', thirtyDaysAgo.toISOString());

      if (error) throw error;

      if (!activeSanctions || activeSanctions.length === 0) {
        console.log('[Cron: ExpiryCheck] Zero expired sanctions detected today.');
        return;
      }

      console.log(`[Cron: ExpiryCheck] Detected ${activeSanctions.length} expired sanctions. Transitioning to EXPIRED...`);

      for (const app of activeSanctions) {
        const ageDays = Math.floor(
          (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Transition application status to EXPIRED
        await this.db
          .from('LoanApplication')
          .update({
            status: 'expired',
            remarks: `Auto-lapsed: Sanction validity of 30 days exceeded (${ageDays} days elapsed).`,
            updatedAt: new Date().toISOString()
          })
          .eq('id', app.id);

        // Insert into ApplicationStatusHistory
        await this.db.from('ApplicationStatusHistory').insert({
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: 'expired',
          changedBy: 'system_cron',
          changedByName: 'VidyaLoans Cron Engine',
          changeReason: `Sanction 30-day validity elapsed (${ageDays} days). Auto-lapsed.`,
          isAutomatic: true,
          createdAt: new Date().toISOString()
        });

        // Notify staff via query
        await this.db.from('queries').insert({
          applicationId: app.id,
          authorName: 'SLA Expiry Monitor',
          content: `🚨 EXPIRED: Sanction for ${app.firstName} ${app.lastName} (${app.applicationNumber || app.id}) has auto-lapsed after ${ageDays} days. Re-verification required.`,
          status: 'open',
          createdAt: new Date().toISOString()
        });

        console.log(`[Cron: ExpiryCheck] Auto-lapsed App ${app.applicationNumber || app.id} (${ageDays} days old).`);
      }
    } catch (err) {
      console.error('[Cron: ExpiryCheck] Error running cron:', err.message);
    }
  }

  /**
   * Daily Cron task: 7-day advance warning before sanction expires.
   * Maps to: '0 8 * * *' (runs at 8am daily)
   * Task 18 — F11: 30d+7d warnings
   */
  async checkSanctionExpiryWarnings(): Promise<void> {
    console.log('[Cron: ExpiryWarning] Scanning for sanctions expiring within 7 days...');

    try {
      // Find sanctions that are 23-29 days old (7 days before the 30-day lapse)
      const twentyThreeDaysAgo = new Date();
      twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23);
      const twentyNineDaysAgo = new Date();
      twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);

      const { data: nearExpiryApps, error } = await this.db
        .from('LoanApplication')
        .select('id, applicationNumber, status, bank, amount, firstName, lastName, updatedAt')
        .in('status', ['approved', 'sanctioned', 'conditional_sanction', 'partial_sanction', 'counter_offer'])
        .lt('updatedAt', twentyThreeDaysAgo.toISOString())
        .gte('updatedAt', twentyNineDaysAgo.toISOString());

      if (error) throw error;

      if (!nearExpiryApps || nearExpiryApps.length === 0) {
        console.log('[Cron: ExpiryWarning] No sanctions nearing expiry.');
        return;
      }

      console.log(`[Cron: ExpiryWarning] ${nearExpiryApps.length} sanction(s) expiring within 7 days.`);

      for (const app of nearExpiryApps) {
        const ageDays = Math.floor(
          (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysRemaining = 30 - ageDays;

        // Insert DB notification for staff
        await this.db.from('Notification').insert({
          userId: 'system',
          title: `⚠️ Sanction Expiry Warning: ${app.firstName} ${app.lastName}`,
          message: `Sanction for ${app.firstName} ${app.lastName} (${app.applicationNumber || app.id}, ₹${app.amount?.toLocaleString('en-IN') || 'N/A'}) at ${app.bank} will auto-lapse in ${daysRemaining} day(s). Please initiate disbursement.`,
          type: 'sanction_expiry_warning',
          isRead: false,
          metadata: { applicationId: app.id, daysRemaining, ageDays },
          createdAt: new Date().toISOString()
        });

        console.log(`[Cron: ExpiryWarning] Warning sent for App ${app.applicationNumber || app.id} — ${daysRemaining} day(s) remaining.`);
      }
    } catch (err) {
      console.error('[Cron: ExpiryWarning] Error running warning cron:', err.message);
    }
  }

  /**
   * Hourly Cron task to detect bank SLA response time breaches (>5 days in review queue).
   * Maps to: '0 * * * *'
   */
  async checkSlaBreaches(): Promise<void> {
    console.log('[Cron: SlaBreach] Scanning for SLA timeline breaches...');
    
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // Find applications stuck in submitted_to_bank or under_bank_review
      const { data: stuckApps, error } = await this.db
        .from('LoanApplication')
        .select('id, applicationNumber, status, bank, updatedAt, firstName, lastName')
        .in('status', ['submitted_to_bank', 'file_logged', 'under_bank_review', 'query_raised'])
        .lt('updatedAt', fiveDaysAgo.toISOString());

      if (error) throw error;

      if (!stuckApps || stuckApps.length === 0) {
        console.log('[Cron: SlaBreach] Zero SLA breaches detected.');
        return;
      }

      console.log(`[Cron: SlaBreach] Detected ${stuckApps.length} SLA breach alerts! Pushing notifications...`);

      for (const app of stuckApps) {
        // Record SLA breach
        await this.db.from('sla_metrics').insert({
          applicationId: app.id,
          stage: app.status,
          tatDays: 5.0,
          slaMet: false,
          createdAt: new Date().toISOString()
        });

        // Insert notifications
        await this.db.from('Notification').insert({
          userId: 'system',
          title: `⚠️ SLA Breach Alert: App ${app.applicationNumber}`,
          message: `Application for ${app.firstName} ${app.lastName} has exceeded the promised 5-day review TAT at partner bank: ${app.bank}.`,
          type: 'sla_breach',
          isRead: false,
          createdAt: new Date().toISOString()
        });

        console.log(`[Cron: SlaBreach] SLA breach flagged on App ${app.applicationNumber} (${app.bank})`);
      }
    } catch (err) {
      console.error('[Cron: SlaBreach] Error running SLA check:', err.message);
    }
  }

  /**
   * Periodic sync running every 15 minutes to synchronize closed applications to Salesforce leads pipeline.
   * Maps to: every 15 minutes
   */
  async autoSalesforceSync(): Promise<void> {
    console.log('[Cron: SalesforceSync] Running periodic lead & opportunity sync...');
    
    try {
      const { data: recentApps, error } = await this.db
        .from('LoanApplication')
        .select('id, firstName, lastName, amount, status, applicationNumber')
        .limit(10); // Batch size

      if (error) throw error;

      for (const app of recentApps) {
        const studentName = `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Student';
        await this.salesforce.syncLeadOrOpportunity(
          app.id,
          studentName,
          app.amount || 100000,
          app.status,
          app.applicationNumber
        );
      }
      console.log('[Cron: SalesforceSync] Sync completed.');
    } catch (err) {
      console.error('[Cron: SalesforceSync] Error running Salesforce Sync Cron:', err.message);
    }
  }

  /**
   * SLA Query monitor (F6) - Hourly reminder and escalations
   */
  async checkQuerySlaTimers(): Promise<void> {
    console.log('[Cron: QuerySLA] Scanning for pending queries SLA status...');
    
    try {
      const { data: pendingQueries, error } = await this.db
        .from('BankWorkflowQueryRequest')
        .select('*')
        .eq('status', 'PENDING');

      if (error) throw error;
      if (!pendingQueries || pendingQueries.length === 0) {
        console.log('[Cron: QuerySLA] Zero pending queries detected.');
        return;
      }

      const now = new Date();

      for (const query of pendingQueries) {
        const { data: submission, error: subError } = await this.db
          .from('BankSubmission')
          .select('isOnHold, slaPausedDurationMs, bankName')
          .eq('id', query.submissionId)
          .single();

        if (subError || !submission) {
          console.warn(`[Cron: QuerySLA] Submission not found for query ${query.id}`);
          continue;
        }

        if (submission.isOnHold) {
          console.log(`[Cron: QuerySLA] Query ${query.id} is paused (Submission ${query.submissionId} is ON HOLD). Skipping.`);
          continue;
        }

        const raisedAt = new Date(query.raisedAt);
        const pausedMs = parseInt(submission.slaPausedDurationMs || '0', 10);
        const elapsedMs = now.getTime() - raisedAt.getTime() - pausedMs;
        const elapsedHours = elapsedMs / 1000 / 60 / 60;

        console.log(`[Cron: QuerySLA] Query ${query.id} elapsed: ${Math.round(elapsedHours)} hours.`);

        if (elapsedHours >= 72) {
          const { data: exists } = await this.db
            .from('Notification')
            .select('id')
            .eq('type', 'query_sla_mgmt_escalate')
            .eq('metadata->>queryId', query.id)
            .maybeSingle();

          if (!exists) {
            await this.db.from('Notification').insert({
              userId: 'system',
              title: `🚨 Query SLA Management Escalation (72h)`,
              message: `CRITICAL: Pending query of type "${query.queryType}" raised by ${submission.bankName} has exceeded 72 hours without response. Immediate management intervention required.`,
              type: 'query_sla_mgmt_escalate',
              isRead: false,
              metadata: { queryId: query.id, submissionId: query.submissionId, elapsedHours },
              createdAt: now.toISOString()
            });
            console.log(`[Cron: QuerySLA] Escalated query ${query.id} to Management.`);
          }
        }
        else if (elapsedHours >= 48) {
          const { data: exists } = await this.db
            .from('Notification')
            .select('id')
            .eq('type', 'query_sla_admin_escalate')
            .eq('metadata->>queryId', query.id)
            .maybeSingle();

          if (!exists) {
            await this.db.from('Notification').insert({
              userId: 'system',
              title: `⚠️ Query SLA Admin Escalation (48h)`,
              message: `WARNING: Pending query of type "${query.queryType}" raised by ${submission.bankName} has exceeded 48 hours. Escalated to administrator.`,
              type: 'query_sla_admin_escalate',
              isRead: false,
              metadata: { queryId: query.id, submissionId: query.submissionId, elapsedHours },
              createdAt: now.toISOString()
            });
            console.log(`[Cron: QuerySLA] Escalated query ${query.id} to Admin.`);
          }
        }
        else if (elapsedHours >= 24) {
          const { data: exists } = await this.db
            .from('Notification')
            .select('id')
            .eq('type', 'query_sla_reminder')
            .eq('metadata->>queryId', query.id)
            .maybeSingle();

          if (!exists) {
            await this.db.from('Notification').insert({
              userId: 'system',
              title: `⏰ Query SLA Reminder (24h)`,
              message: `Reminder: There is a pending query of type "${query.queryType}" raised by ${submission.bankName} that requires response.`,
              type: 'query_sla_reminder',
              isRead: false,
              metadata: { queryId: query.id, submissionId: query.submissionId, elapsedHours },
              createdAt: now.toISOString()
            });
            console.log(`[Cron: QuerySLA] Sent 24h reminder for query ${query.id}.`);
          }
        }
      }
    } catch (err: any) {
      console.error('[Cron: QuerySLA] Error running query SLA cron:', err.message);
    }
  }

  /**
   * Daily Cron checking validity ranges of active bank schemes and deactivating them.
   */
  async checkSchemeExpiries(): Promise<void> {
    console.log('[Cron: SchemesExpiryCheck] Running bank schemes validity checker...');
    try {
      const expiredCount = await this.schemesService.expireExpiredSchemes();
      console.log(`[Cron: SchemesExpiryCheck] Schemes check finished. Expired count: ${expiredCount}`);
    } catch (e) {
      console.error('[Cron: SchemesExpiryCheck] Schemes expiry checker failed:', e.message);
    }
  }

  /**
   * Daily Cron: sends pipeline summary email.
   */
  async sendDailySummaryReport(): Promise<void> {
    console.log('[Cron: DailySummary] Compiling daily pipeline MIS summary...');
    try {
      const { data: apps } = await this.db.from('LoanApplication').select('id, amount, status');
      const total = apps ? apps.length : 0;
      const sanctioned = apps ? apps.filter((a: any) => a.status === 'sanctioned').length : 0;
      const rejected = apps ? apps.filter((a: any) => a.status === 'rejected').length : 0;
      const pending = total - sanctioned - rejected;

      const pipelineVal = apps ? apps.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0) : 0;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2>📊 VidyaLoans Daily Pipeline MIS Summary</h2>
          <p>Here is your automated daily update on the application pipelines:</p>
          <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f2f2f2;"><th>Metric</th><th>Count / Value</th></tr>
            <tr><td>Total Applications</td><td><b>${total}</b></td></tr>
            <tr><td>Active Pipeline Value</td><td><b>₹${pipelineVal.toLocaleString('en-IN')}</b></td></tr>
            <tr><td>Sanctioned Loans</td><td style="color: green;"><b>${sanctioned}</b></td></tr>
            <tr><td>Rejected Loans</td><td style="color: red;"><b>${rejected}</b></td></tr>
            <tr><td>Pending Decision</td><td style="color: orange;"><b>${pending}</b></td></tr>
          </table>
          <p>Please visit the admin dashboard for detailed lists and query resolution queues.</p>
        </div>
      `;

      await this.emailService.sendMail('harikikeerthi@gmail.com', '📊 VidyaLoans Daily Summary Report', html);
      console.log('[Cron: DailySummary] Daily summary report sent successfully!');
    } catch (e) {
      console.error('[Cron: DailySummary] Cron failed:', e.message);
    }
  }

  /**
   * Weekly Cron: sends pipeline summary email.
   */
  async sendWeeklyPipelineReport(): Promise<void> {
    console.log('[Cron: WeeklyPipeline] Compiling weekly pipeline summary...');
    try {
      const { data: apps } = await this.db.from('LoanApplication').select('id, amount, status, bank');
      const total = apps ? apps.length : 0;
      const pipelineVal = apps ? apps.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0) : 0;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2>📅 VidyaLoans Weekly Pipeline MIS Summary</h2>
          <p>Here is your weekly update on active pipeline value and distribution:</p>
          <ul>
            <li>Total Applications: <b>${total}</b></li>
            <li>Weekly Active Pipeline: <b>₹${pipelineVal.toLocaleString('en-IN')}</b></li>
          </ul>
          <p>Track RM targets and branch SLA progress on the portal.</p>
        </div>
      `;

      await this.emailService.sendMail('harikikeerthi@gmail.com', '📅 VidyaLoans Weekly Summary Report', html);
      console.log('[Cron: WeeklyPipeline] Weekly pipeline report sent successfully!');
    } catch (e) {
      console.error('[Cron: WeeklyPipeline] Cron failed:', e.message);
    }
  }

  /**
   * Monthly Cron: sends pipeline summary email.
   */
  async sendMonthlyMisReport(): Promise<void> {
    console.log('[Cron: MonthlyMIS] Compiling monthly MIS summary...');
    try {
      const { data: apps } = await this.db.from('LoanApplication').select('id, amount, status');
      const total = apps ? apps.length : 0;
      const pipelineVal = apps ? apps.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0) : 0;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2>🏢 VidyaLoans Monthly MIS Summary</h2>
          <p>Here is your monthly executive snapshot:</p>
          <ul>
            <li>Total Applications Managed: <b>${total}</b></li>
            <li>Gross Pipeline Volume: <b>₹${pipelineVal.toLocaleString('en-IN')}</b></li>
          </ul>
          <p>All targets and operational parameters are fully synchronized with the CRM.</p>
        </div>
      `;

      await this.emailService.sendMail('harikikeerthi@gmail.com', '🏢 VidyaLoans Monthly MIS Executive Snapshot', html);
      console.log('[Cron: MonthlyMIS] Monthly MIS report sent successfully!');
    } catch (e) {
      console.error('[Cron: MonthlyMIS] Cron failed:', e.message);
    }
  }
}
