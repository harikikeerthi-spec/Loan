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
   * Daily Cron task running at midnight to check for expired sanctions (>30 days).
   * Maps to: '0 0 * * *'
   */
  async checkSanctionExpiries(): Promise<void> {
    console.log('[Cron: ExpiryCheck] Scanning for inactive sanctions older than 30 days...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find applications in sanction stage that haven't been advanced
      const { data: activeSanctions, error } = await this.db
        .from('LoanApplication')
        .select('id, applicationNumber, status, bank, amount, firstName, lastName')
        .in('status', ['approved', 'sanctioned', 'conditional_sanction', 'counter_offer'])
        .lt('updatedAt', thirtyDaysAgo.toISOString());

      if (error) throw error;

      if (!activeSanctions || activeSanctions.length === 0) {
        console.log('[Cron: ExpiryCheck] Zero expired sanctions detected today.');
        return;
      }

      console.log(`[Cron: ExpiryCheck] Detected ${activeSanctions.length} expired sanctions. Transitioning to EXPIRED...`);

      for (const app of activeSanctions) {
        // Transition application status to EXPIRED
        await this.db
          .from('LoanApplication')
          .update({
            status: 'expired',
            remarks: 'Lapsed automatically: Sanction letter expired (30-day timeline exceeded).',
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
          changeReason: 'Sanction 30-day validity elapsed without disbursement.',
          isAutomatic: true,
          createdAt: new Date().toISOString()
        });

        // Insert in queries to notify staff
        await this.db.from('queries').insert({
          applicationId: app.id,
          authorName: 'SLA Expiry Monitor',
          content: `Alert: Sanction for student ${app.firstName} ${app.lastName} (${app.applicationNumber}) has lapsed. Re-verification required.`,
          status: 'open',
          createdAt: new Date().toISOString()
        });

        console.log(`[Cron: ExpiryCheck] Successfully marked App ${app.applicationNumber} as EXPIRED.`);
      }
    } catch (err) {
      console.error('[Cron: ExpiryCheck] Error running cron:', err.message);
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
