import { Injectable, Logger } from '@nestjs/common';
import * as jsforce from 'jsforce';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SalesforceService {
  private readonly logger = new Logger(SalesforceService.name);
  private conn: any = null;

  private async getConnection(): Promise<any> {
    if (this.conn) return this.conn;

    const username = process.env.SF_USERNAME;
    const password = process.env.SF_PASSWORD;
    const token = process.env.SF_SECURITY_TOKEN;
    const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

    if (!username || !password) {
      this.logger.warn('[SalesforceService] SF_USERNAME or SF_PASSWORD not set. Running in Mock Mode.');
      return null;
    }

    try {
      const conn = new jsforce.Connection({ loginUrl });
      await conn.login(username, password + (token || ''));
      this.logger.log('[SalesforceService] Connected to Salesforce CRM successfully!');
      this.conn = conn;
      return this.conn;
    } catch (e) {
      this.logger.error(`[SalesforceService] Salesforce Login failed: ${e.message}. Falling back to Mock Mode.`);
      return null;
    }
  }

  /**
   * Syncs a student to Salesforce CRM as a Lead.
   */
  async syncStudentAsLead(student: any): Promise<any> {
    this.logger.log(`[SalesforceService] Syncing Student ${student.email} as Lead to Salesforce...`);
    const conn = await this.getConnection();

    const leadPayload = {
      FirstName: student.firstName || 'Student',
      LastName: student.lastName || 'External',
      Email: student.email,
      Phone: student.phoneNumber || student.mobile || '',
      Company: 'VidyaLoans Applicant',
      LeadSource: 'Vidyaloan Portal',
      Status: 'Open - Not Contacted'
    };

    if (conn) {
      try {
        const result = await conn.sobject('Lead').create(leadPayload);
        this.logger.log(`[SalesforceService] Salesforce Lead created successfully! ID: ${result.id}`);
        return { success: true, salesforceId: result.id, data: leadPayload };
      } catch (e) {
        this.logger.error(`[SalesforceService] SObject Lead creation failed: ${e.message}`);
      }
    }

    return {
      success: true,
      salesforceId: `00Q8000000abc${Math.floor(Math.random() * 900) + 100}`,
      recordType: 'Lead',
      status: 'Synchronized (Mock)',
      syncedData: leadPayload
    };
  }

  /**
   * Simulates bi-directional lead/opportunity state synchronization with Salesforce CRM.
   */
  async syncLeadOrOpportunity(
    applicationId: string,
    studentName: string,
    amount: number,
    status: string,
    lanNumber?: string
  ): Promise<any> {
    this.logger.log(`[SalesforceService] Synchronizing application ${applicationId} to Salesforce CRM Leads & Opportunities...`);
    const conn = await this.getConnection();

    // Map Lead status to CRM schema Opportunity stage
    let sfStage = 'Prospecting';
    if (status === 'submitted_to_bank') sfStage = 'Qualification';
    else if (status === 'file_logged' || status === 'under_bank_review') sfStage = 'Needs Analysis';
    else if (['approved', 'sanctioned', 'conditional_sanction'].includes(status)) sfStage = 'Proposal/Price Quote';
    else if (status === 'disbursement_confirmed' || status === 'closed') sfStage = 'Closed Won';
    else if (status === 'rejected') sfStage = 'Closed Lost';

    const sfPayload = {
      OpportunityName: `EduLoan-${studentName}-${new Date().getFullYear()}`,
      StageName: sfStage,
      Amount: amount,
      CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days out
      Loan_Account_Number__c: lanNumber || 'PENDING',
      VL_Status__c: status,
      Last_Sync_Timestamp__c: new Date().toISOString()
    };

    if (conn) {
      try {
        const result = await conn.sobject('Opportunity').create({
          Name: sfPayload.OpportunityName,
          StageName: sfPayload.StageName,
          Amount: sfPayload.Amount,
          CloseDate: sfPayload.CloseDate,
          Description: `LAN: ${sfPayload.Loan_Account_Number__c}, Status: ${sfPayload.VL_Status__c}`
        });
        this.logger.log(`[SalesforceService] Salesforce Opportunity synced successfully! ID: ${result.id}`);
        return { success: true, salesforceId: result.id, recordType: 'Opportunity', data: sfPayload };
      } catch (e) {
        this.logger.error(`[SalesforceService] SObject Opportunity creation failed: ${e.message}`);
      }
    }

    return {
      success: true,
      salesforceId: `0068000000abc${applicationId.substring(0, 3)}`,
      recordType: 'Opportunity',
      status: 'Synchronized (Mock)',
      syncedData: sfPayload
    };
  }

  @OnEvent('user.created')
  async handleUserCreated(payload: any) {
    this.logger.log(`[SalesforceService] Event user.created received for: ${payload.email}`);
    if (payload.role === 'user' || payload.role === 'student') {
      await this.syncStudentAsLead(payload);
    }
  }
}
