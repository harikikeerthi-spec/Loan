import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesforceService {
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
    console.log(`[SalesforceService] Synchronizing application ${applicationId} to Salesforce CRM Leads & Opportunities...`);

    // Map Lead status to CRM schema
    let sfStage = 'Prospecting';
    if (status === 'submitted_to_bank') sfStage = 'Qualification';
    else if (status === 'file_logged' || status === 'under_bank_review') sfStage = 'Needs Analysis';
    else if (['approved', 'sanctioned', 'conditional_sanction'].includes(status)) sfStage = 'Proposal/Price Quote';
    else if (status === 'disbursement_confirmed' || status === 'closed') sfStage = 'Closed Won';
    else if (status === 'rejected') sfStage = 'Closed Lost';

    const sfPayload = {
      LeadOrOpportunityId: `0068000000abc${applicationId.substring(0, 3)}`,
      AccountName: studentName,
      OpportunityName: `EduLoan-${studentName}-${new Date().getFullYear()}`,
      StageName: sfStage,
      Amount: amount,
      CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days out
      Loan_Account_Number__c: lanNumber || 'PENDING',
      VL_Status__c: status,
      Last_Sync_Timestamp__c: new Date().toISOString()
    };

    console.log('[SalesforceService] Salesforce Sync Payload mapped:', sfPayload);

    // Mock response log
    return {
      success: true,
      salesforceId: sfPayload.LeadOrOpportunityId,
      recordType: 'Opportunity',
      status: 'Synchronized',
      conflictResolved: false,
      mappedFieldsCount: Object.keys(sfPayload).length,
      syncedData: sfPayload
    };
  }
}
