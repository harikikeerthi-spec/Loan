import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BankWorkflowConfig {
  maxQueryRetries: number;
  queryResponseDays: number;
  processingFeeDays: number;
  disbursementDays: number;
}

// Workflow states and valid transitions
const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  'SUBMITTED_TO_BANK': ['FILE_LOGGED', 'REJECTED'],
  'FILE_LOGGED': ['UNDER_REVIEW', 'REJECTED'],
  'UNDER_REVIEW': ['QUERY_RAISED', 'SANCTIONED', 'CONDITIONAL_SANCTION', 'COUNTER_OFFER', 'REJECTED'],
  'QUERY_RAISED': ['UNDER_REVIEW', 'REJECTED'],
  'SANCTIONED': ['PROCESSING_FEE', 'REJECTED'],
  'CONDITIONAL_SANCTION': ['SANCTIONED', 'REJECTED'],
  'COUNTER_OFFER': ['SANCTIONED', 'REJECTED'],
  'PROCESSING_FEE': ['DISBURSEMENT_PENDING', 'REJECTED'],
  'DISBURSEMENT_PENDING': ['DISBURSED', 'REJECTED'],
  'DISBURSED': [],
  'REJECTED': ['RESUBMIT_OTHER_BANK'],
  'RESUBMIT_OTHER_BANK': ['SUBMITTED_TO_BANK'],
};

@Injectable()
export class BankWorkflowService {
  constructor(
    private readonly db: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Share application with a bank (SUBMITTED_TO_BANK)
   */
  async submitApplicationToBank(
    applicationId: string,
    bankId: string,
    bankName: string,
    submittedBy: string,
  ) {
    // Get application
    const { data: application, error: appError } = await this.db.client
      .from('LoanApplication')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new NotFoundException('Application not found');
    }

    // Check if already submitted to this bank
    const { data: existing } = await this.db.client
      .from('BankSubmission')
      .select('id')
      .eq('applicationId', applicationId)
      .eq('bankId', bankId)
      .single();

    if (existing) {
      throw new BadRequestException('Application already submitted to this bank');
    }

    // Create bank submission record
    const { data: submission, error: submitError } = await this.db.client
      .from('BankSubmission')
      .insert({
        applicationId,
        bankId,
        bankName,
        submittedBy,
        workflowStatus: 'SUBMITTED_TO_BANK',
        currentStage: 'SUBMITTED_TO_BANK',
        statusHistory: [
          {
            fromStatus: null,
            toStatus: 'SUBMITTED_TO_BANK',
            changedAt: new Date().toISOString(),
            changedBy: submittedBy,
            reason: 'Application shared with bank',
          },
        ],
      })
      .select()
      .single();

    if (submitError) {
      throw submitError;
    }

    // Update LoanApplication with bank submission reference
    await this.db.client
      .from('LoanApplication')
      .update({
        bankSubmissionId: submission.id,
        bankWorkflowStatus: 'SUBMITTED_TO_BANK',
        bankWorkflowStage: 'SUBMITTED_TO_BANK',
        submittedToBankAt: new Date().toISOString(),
      })
      .eq('id', applicationId);

    // Record in workflow history
    await this.recordWorkflowHistory(submission.id, applicationId, null, 'SUBMITTED_TO_BANK', submittedBy, 'Application shared with bank');

    // Emit event
    this.eventEmitter.emit('bank.submission.created', {
      submissionId: submission.id,
      applicationId,
      bankId,
      bankName,
    });

    return { success: true, data: submission };
  }

  /**
   * Log file (FILE_LOGGED) - Bank assigns LAN and logs file
   */
  async logFile(
    submissionId: string,
    lanNumber: string,
    loggedBy: string,
    notes?: string,
  ) {
    // Get submission
    const submission = await this.getSubmission(submissionId);

    // Validate transition
    if (!this.isValidTransition(submission.workflowStatus, 'FILE_LOGGED')) {
      throw new BadRequestException(
        `Cannot transition from ${submission.workflowStatus} to FILE_LOGGED`,
      );
    }

    // Check for duplicate LAN
    const { data: existingLan } = await this.db.client
      .from('BankSubmission')
      .select('id')
      .eq('lanNumber', lanNumber)
      .neq('id', submissionId)
      .single();

    if (existingLan) {
      throw new BadRequestException('LAN number already exists');
    }

    // Update submission
    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'FILE_LOGGED',
        currentStage: 'FILE_LOGGED',
        lanNumber,
        fileLoggedAt: new Date().toISOString(),
        fileLoggedBy: loggedBy,
        comments: notes,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    // Record in workflow history
    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      'SUBMITTED_TO_BANK',
      'FILE_LOGGED',
      loggedBy,
      `File logged with LAN: ${lanNumber}`,
    );

    // Update LoanApplication
    await this.db.client
      .from('LoanApplication')
      .update({
        bankWorkflowStatus: 'FILE_LOGGED',
        lanNumber,
      })
      .eq('id', submission.applicationId);

    this.eventEmitter.emit('bank.file.logged', {
      submissionId,
      applicationId: submission.applicationId,
      lanNumber,
    });

    return { success: true, data: updated };
  }

  /**
   * Move to UNDER_REVIEW
   */
  async moveToUnderReview(submissionId: string, changedBy: string, notes?: string) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'UNDER_REVIEW')) {
      throw new BadRequestException(
        `Cannot transition from ${submission.workflowStatus} to UNDER_REVIEW`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'UNDER_REVIEW',
        currentStage: 'UNDER_REVIEW',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'UNDER_REVIEW',
      changedBy,
      notes || 'Application moved to under review',
    );

    await this.db.client
      .from('LoanApplication')
      .update({ bankWorkflowStatus: 'UNDER_REVIEW' })
      .eq('id', submission.applicationId);

    return { success: true, data: updated };
  }

  /**
   * Raise query (QUERY_RAISED)
   */
  async raiseQuery(
    submissionId: string,
    queryType: string,
    queryDescription: string,
    raisedBy: string,
    dueDate?: Date,
  ) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'QUERY_RAISED')) {
      throw new BadRequestException(
        `Cannot raise query from ${submission.workflowStatus} status`,
      );
    }

    // Create query record
    const { data: query, error: queryError } = await this.db.client
      .from('BankWorkflowQueryRequest')
      .insert({
        submissionId,
        applicationId: submission.applicationId,
        queryType,
        queryDescription,
        raisedBy,
        dueDate: dueDate?.toISOString(),
        status: 'PENDING',
      })
      .select()
      .single();

    if (queryError) throw queryError;

    // Update submission to QUERY_RAISED
    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'QUERY_RAISED',
        currentStage: 'QUERY_RAISED',
        queriesRaised: (submission.queriesRaised || 0) + 1,
        lastQueryAt: new Date().toISOString(),
        queryResponsePending: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'QUERY_RAISED',
      raisedBy,
      `Query raised: ${queryType} - ${queryDescription}`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({ bankWorkflowStatus: 'QUERY_RAISED' })
      .eq('id', submission.applicationId);

    this.eventEmitter.emit('bank.query.raised', {
      submissionId,
      applicationId: submission.applicationId,
      queryId: query.id,
    });

    return { success: true, data: query };
  }

  /**
   * Respond to query and move back to UNDER_REVIEW
   */
  async respondToQuery(
    queryId: string,
    response: string,
    respondedBy: string,
  ) {
    // Get query
    const { data: query, error: queryError } = await this.db.client
      .from('BankWorkflowQueryRequest')
      .select('*')
      .eq('id', queryId)
      .single();

    if (queryError || !query) {
      throw new NotFoundException('Query not found');
    }

    // Update query
    const { data: updatedQuery, error: updateError } = await this.db.client
      .from('BankWorkflowQueryRequest')
      .update({
        status: 'RESPONDED',
        response,
        respondedBy,
        respondedAt: new Date().toISOString(),
      })
      .eq('id', queryId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Check if all queries for this submission are responded
    const { data: pendingQueries } = await this.db.client
      .from('BankWorkflowQueryRequest')
      .select('id')
      .eq('submissionId', query.submissionId)
      .eq('status', 'PENDING');

    // Move back to UNDER_REVIEW if all queries are responded
    if (!pendingQueries || pendingQueries.length === 0) {
      const { data: submission } = await this.db.client
        .from('BankSubmission')
        .select('*')
        .eq('id', query.submissionId)
        .single();

      await this.db.client
        .from('BankSubmission')
        .update({
          workflowStatus: 'UNDER_REVIEW',
          currentStage: 'UNDER_REVIEW',
          queryResponsePending: false,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', query.submissionId);

      await this.recordWorkflowHistory(
        query.submissionId,
        query.applicationId,
        'QUERY_RAISED',
        'UNDER_REVIEW',
        respondedBy,
        'All queries responded, moving back to under review',
      );

      await this.db.client
        .from('LoanApplication')
        .update({ bankWorkflowStatus: 'UNDER_REVIEW' })
        .eq('id', query.applicationId);
    }

    return { success: true, data: updatedQuery };
  }

  /**
   * Approve application (SANCTIONED)
   */
  async sanctionApplication(
    submissionId: string,
    sanctionDetails: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      roiSubsidy?: number;
      tenure: number;
      decisionNotes?: string;
    },
    decidedBy: string,
  ) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'SANCTIONED')) {
      throw new BadRequestException(
        `Cannot sanction from ${submission.workflowStatus} status`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'SANCTIONED',
        currentStage: 'SANCTIONED',
        decisionStatus: 'SANCTIONED',
        decisionMadeAt: new Date().toISOString(),
        decisionMadeBy: decidedBy,
        decisionNotes: sanctionDetails.decisionNotes,
        sanctionAmount: sanctionDetails.sanctionAmount,
        roiType: sanctionDetails.roiType,
        roiBase: sanctionDetails.roiBase,
        roiEffective: sanctionDetails.roiEffective,
        roiSubsidy: sanctionDetails.roiSubsidy,
        tenure: sanctionDetails.tenure,
        sanctionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'SANCTIONED',
      decidedBy,
      `Application sanctioned for ₹${sanctionDetails.sanctionAmount}`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({
        bankWorkflowStatus: 'SANCTIONED',
        status: 'approved',
        sanctionAmount: sanctionDetails.sanctionAmount,
        roiType: sanctionDetails.roiType,
        roiBase: sanctionDetails.roiBase,
        roiEffective: sanctionDetails.roiEffective,
        roiSubsidy: sanctionDetails.roiSubsidy,
      })
      .eq('id', submission.applicationId);

    this.eventEmitter.emit('bank.application.sanctioned', {
      submissionId,
      applicationId: submission.applicationId,
      sanctionAmount: sanctionDetails.sanctionAmount,
    });

    return { success: true, data: updated };
  }

  /**
   * Conditional sanction
   */
  async conditionalSanctionApplication(
    submissionId: string,
    sanctionDetails: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      tenure: number;
      conditions: string[];
      decisionNotes?: string;
    },
    decidedBy: string,
  ) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'CONDITIONAL_SANCTION')) {
      throw new BadRequestException(
        `Cannot conditionally sanction from ${submission.workflowStatus} status`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'CONDITIONAL_SANCTION',
        currentStage: 'CONDITIONAL_SANCTION',
        decisionStatus: 'CONDITIONAL_SANCTION',
        decisionMadeAt: new Date().toISOString(),
        decisionMadeBy: decidedBy,
        decisionNotes: sanctionDetails.decisionNotes,
        sanctionAmount: sanctionDetails.sanctionAmount,
        roiType: sanctionDetails.roiType,
        roiBase: sanctionDetails.roiBase,
        roiEffective: sanctionDetails.roiEffective,
        tenure: sanctionDetails.tenure,
        conditions: sanctionDetails.conditions,
        sanctionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'CONDITIONAL_SANCTION',
      decidedBy,
      `Conditional sanction for ₹${sanctionDetails.sanctionAmount}`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({ bankWorkflowStatus: 'CONDITIONAL_SANCTION' })
      .eq('id', submission.applicationId);

    this.eventEmitter.emit('bank.application.conditional_sanctioned', {
      submissionId,
      applicationId: submission.applicationId,
    });

    return { success: true, data: updated };
  }

  /**
   * Counter offer
   */
  async makeCounterOffer(
    submissionId: string,
    counterOfferDetails: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      tenure: number;
      terms: string;
    },
    decidedBy: string,
  ) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'COUNTER_OFFER')) {
      throw new BadRequestException(
        `Cannot make counter offer from ${submission.workflowStatus} status`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'COUNTER_OFFER',
        currentStage: 'COUNTER_OFFER',
        decisionStatus: 'COUNTER_OFFER',
        decisionMadeAt: new Date().toISOString(),
        decisionMadeBy: decidedBy,
        sanctionAmount: counterOfferDetails.sanctionAmount,
        roiType: counterOfferDetails.roiType,
        roiBase: counterOfferDetails.roiBase,
        roiEffective: counterOfferDetails.roiEffective,
        tenure: counterOfferDetails.tenure,
        counterOfferDetails: counterOfferDetails,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'COUNTER_OFFER',
      decidedBy,
      `Counter offer made: ₹${counterOfferDetails.sanctionAmount} @ ${counterOfferDetails.roiEffective}%`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({ bankWorkflowStatus: 'COUNTER_OFFER' })
      .eq('id', submission.applicationId);

    return { success: true, data: updated };
  }

  /**
   * Reject application
   */
  async rejectApplication(
    submissionId: string,
    rejectionDetails: {
      reason: string;
      category: string;
      decisionNotes?: string;
    },
    decidedBy: string,
  ) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'REJECTED')) {
      throw new BadRequestException(
        `Cannot reject from ${submission.workflowStatus} status`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'REJECTED',
        currentStage: 'REJECTED',
        decisionStatus: 'REJECTED',
        decisionMadeAt: new Date().toISOString(),
        decisionMadeBy: decidedBy,
        rejectionReason: rejectionDetails.reason,
        rejectionCategory: rejectionDetails.category,
        decisionNotes: rejectionDetails.decisionNotes,
        canResubmitToOtherBank: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'REJECTED',
      decidedBy,
      `Rejected: ${rejectionDetails.category} - ${rejectionDetails.reason}`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({
        bankWorkflowStatus: 'REJECTED',
        status: 'rejected',
      })
      .eq('id', submission.applicationId);

    this.eventEmitter.emit('bank.application.rejected', {
      submissionId,
      applicationId: submission.applicationId,
      reason: rejectionDetails.reason,
    });

    return { success: true, data: updated };
  }

  /**
   * Move to PROCESSING_FEE
   */
  async moveToProcessingFee(submissionId: string, feeAmount: number, changedBy: string) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'PROCESSING_FEE')) {
      throw new BadRequestException(
        `Cannot move to PROCESSING_FEE from ${submission.workflowStatus} status`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'PROCESSING_FEE',
        currentStage: 'PROCESSING_FEE',
        processingFeeAmount: feeAmount,
        processingFeeStatus: 'PENDING',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'PROCESSING_FEE',
      changedBy,
      `Processing fee of ₹${feeAmount} pending`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({ bankWorkflowStatus: 'PROCESSING_FEE' })
      .eq('id', submission.applicationId);

    return { success: true, data: updated };
  }

  /**
   * Mark processing fee as paid and move to DISBURSEMENT_PENDING
   */
  async markFeeAsPaid(submissionId: string, changedBy: string) {
    const submission = await this.getSubmission(submissionId);

    if (submission.workflowStatus !== 'PROCESSING_FEE') {
      throw new BadRequestException('Submission not in PROCESSING_FEE status');
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'DISBURSEMENT_PENDING',
        currentStage: 'DISBURSEMENT_PENDING',
        processingFeeStatus: 'PAID',
        processingFeePaidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      'PROCESSING_FEE',
      'DISBURSEMENT_PENDING',
      changedBy,
      'Processing fee paid, moving to disbursement',
    );

    await this.db.client
      .from('LoanApplication')
      .update({ bankWorkflowStatus: 'DISBURSEMENT_PENDING' })
      .eq('id', submission.applicationId);

    return { success: true, data: updated };
  }

  /**
   * Confirm disbursement (DISBURSED)
   */
  async confirmDisbursement(
    submissionId: string,
    disbursementDetails: {
      amount: number;
      referenceNo: string;
    },
    confirmedBy: string,
  ) {
    const submission = await this.getSubmission(submissionId);

    if (!this.isValidTransition(submission.workflowStatus, 'DISBURSED')) {
      throw new BadRequestException(
        `Cannot disburse from ${submission.workflowStatus} status`,
      );
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        workflowStatus: 'DISBURSED',
        currentStage: 'DISBURSED',
        disbursementStatus: 'COMPLETED',
        disbursementAmount: disbursementDetails.amount,
        disbursementReferenceNo: disbursementDetails.referenceNo,
        disbursementDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      submission.workflowStatus,
      'DISBURSED',
      confirmedBy,
      `Disbursement confirmed: ₹${disbursementDetails.amount} (Ref: ${disbursementDetails.referenceNo})`,
    );

    await this.db.client
      .from('LoanApplication')
      .update({
        bankWorkflowStatus: 'DISBURSED',
        status: 'disbursed',
      })
      .eq('id', submission.applicationId);

    this.eventEmitter.emit('bank.application.disbursed', {
      submissionId,
      applicationId: submission.applicationId,
      amount: disbursementDetails.amount,
    });

    return { success: true, data: updated };
  }

  /**
   * Allow resubmission to another bank
   */
  async allowResubmission(submissionId: string, authorizedBy: string) {
    const submission = await this.getSubmission(submissionId);

    if (submission.workflowStatus !== 'REJECTED') {
      throw new BadRequestException('Only rejected applications can be resubmitted');
    }

    const { data: updated, error } = await this.db.client
      .from('BankSubmission')
      .update({
        canResubmitToOtherBank: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    await this.recordWorkflowHistory(
      submissionId,
      submission.applicationId,
      'REJECTED',
      'RESUBMIT_OTHER_BANK',
      authorizedBy,
      'Application allowed to be resubmitted to another bank',
    );

    return { success: true, data: updated };
  }

  // ============== HELPER METHODS ==============

  private async getSubmission(submissionId: string) {
    const { data: submission, error } = await this.db.client
      .from('BankSubmission')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      throw new NotFoundException('Bank submission not found');
    }

    return submission;
  }

  private isValidTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions = WORKFLOW_TRANSITIONS[fromStatus] || [];
    return validTransitions.includes(toStatus);
  }

  private async recordWorkflowHistory(
    submissionId: string,
    applicationId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    changeReason: string,
  ) {
    await this.db.client
      .from('BankWorkflowHistory')
      .insert({
        submissionId,
        applicationId,
        fromStatus,
        toStatus,
        changedBy,
        changeReason,
        metadata: {
          changedAt: new Date().toISOString(),
        },
      });
  }

  /**
   * Get submission details with queries
   */
  async getSubmissionWithDetails(submissionId: string) {
    const submission = await this.getSubmission(submissionId);

    const { data: queries } = await this.db.client
      .from('BankWorkflowQueryRequest')
      .select('*')
      .eq('submissionId', submissionId)
      .order('createdAt', { ascending: false });

    const { data: history } = await this.db.client
      .from('BankWorkflowHistory')
      .select('*')
      .eq('submissionId', submissionId)
      .order('createdAt', { ascending: false });

    return {
      submission,
      queries: queries || [],
      history: history || [],
    };
  }

  /**
   * Get bank incoming applications
   */
  async getBankIncomingApplications(bankId: string, filters?: { status?: string; limit?: number; offset?: number }) {
    let query = this.db.client
      .from('BankSubmission')
      .select('*, application:LoanApplication(*)', { count: 'exact' })
      .eq('bankId', bankId)
      .order('submittedAt', { ascending: false });

    if (filters?.status) {
      query = query.eq('workflowStatus', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        total: count || 0,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      },
    };
  }

  /**
   * Get workflow analytics for bank
   */
  async getBankWorkflowAnalytics(bankId: string) {
    const { data: submissions } = await this.db.client
      .from('BankSubmission')
      .select('workflowStatus, decisionStatus, disbursementStatus, sanctionAmount, disbursementAmount')
      .eq('bankId', bankId);

    if (!submissions) {
      return {
        totalApplications: 0,
        byStatus: {},
        byDecision: {},
        totalSanctioned: 0,
        totalDisbursed: 0,
        pendingDecision: 0,
      };
    }

    const byStatus = submissions.reduce(
      (acc, s) => {
        acc[s.workflowStatus] = (acc[s.workflowStatus] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byDecision = submissions.reduce(
      (acc, s) => {
        if (s.decisionStatus) {
          acc[s.decisionStatus] = (acc[s.decisionStatus] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalSanctioned = submissions
      .filter((s) => s.decisionStatus === 'SANCTIONED')
      .reduce((acc, s) => acc + (s.sanctionAmount || 0), 0);

    const totalDisbursed = submissions
      .filter((s) => s.disbursementStatus === 'COMPLETED')
      .reduce((acc, s) => acc + (s.disbursementAmount || 0), 0);

    const pendingDecision = (byStatus['UNDER_REVIEW'] || 0) + (byStatus['QUERY_RAISED'] || 0);

    return {
      totalApplications: submissions.length,
      byStatus,
      byDecision,
      totalSanctioned,
      totalDisbursed,
      pendingDecision,
    };
  }
}
