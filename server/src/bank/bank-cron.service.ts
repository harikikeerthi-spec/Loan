import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SalesforceService } from './salesforce.service';

@Injectable()
export class BankCronService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly salesforce: SalesforceService
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
}
