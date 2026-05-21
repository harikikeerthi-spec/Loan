import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BankDashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  // ==================== PRODUCTS & CONFIGURATION ====================

  async getBankProducts(bankId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('BankProduct')
      .select('*')
      .eq('bankId', bankId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addBankProduct(bankId: string, productData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankProduct')
      .insert({
        bankId,
        productName: productData.productName,
        eligibility: productData.eligibility,
        maxAmount: productData.maxAmount,
        minAmount: productData.minAmount,
        roiMin: productData.roiMin,
        roiMax: productData.roiMax,
        processingFee: productData.processingFee,
        maxTenure: productData.maxTenure,
        moratoriumRule: productData.moratoriumRule,
        requiredDocs: productData.requiredDocs,
        isActive: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBankProduct(productId: string, productData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankProduct')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getBankBranches(bankId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('BankBranch')
      .select('*')
      .eq('bankId', bankId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addBankBranch(bankId: string, branchData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankBranch')
      .insert({
        bankId,
        branchName: branchData.branchName,
        branchCode: branchData.branchCode,
        coverageAreas: branchData.coverageAreas,
        maxCapacity: branchData.maxCapacity
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== FILE LOGGING & LAN ====================

  async logFileWithLAN(applicationId: string, lanNumber: string, bankUser: any): Promise<any> {
    const { data: application, error: fetchError } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    const now = new Date().toISOString();

    // Update application with LAN
    const { data: updated, error: updateError } = await this.db
      .from('LoanApplication')
      .update({
        lanNumber,
        lanEnteredAt: now,
        fileLoggedBy: bankUser.id,
        status: 'file_logged',
        updatedAt: now
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log audit
    await this.logAudit({
      entityType: 'LOAN',
      entityId: applicationId,
      action: 'FILE_LOGGED',
      performedBy: bankUser.email,
      role: bankUser.role,
      details: { lanNumber }
    });

    return updated;
  }

  async getFilesByLAN(lanNumber: string): Promise<any> {
    const { data, error } = await this.db
      .from('LoanApplication')
      .select(`
        *,
        BankDecision(*)
      `)
      .eq('lanNumber', lanNumber)
      .single();

    if (error || !data) {
      throw new NotFoundException(`File with LAN ${lanNumber} not found`);
    }

    return data;
  }

  // ==================== ROI & PROCESSING FEE ====================

  async setROI(applicationId: string, roiData: any, bankUser: any): Promise<any> {
    const { data: updated, error } = await this.db
      .from('LoanApplication')
      .update({
        roiType: roiData.roiType,
        roiBase: roiData.roiBase,
        roiEffective: roiData.roiEffective,
        roiSubsidy: roiData.roiSubsidy,
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit({
      entityType: 'LOAN',
      entityId: applicationId,
      action: 'ROI_SET',
      performedBy: bankUser.email,
      role: bankUser.role,
      details: roiData
    });

    return updated;
  }

  async setProcessingFee(applicationId: string, feeData: any, bankUser: any): Promise<any> {
    const gstAmount = feeData.feeAmount * 0.18; // 18% GST
    const totalAmount = feeData.feeAmount + gstAmount;

    const { data, error } = await this.db
      .from('ProcessingFee')
      .upsert(
        {
          applicationId,
          lanNumber: feeData.lanNumber,
          feeAmount: feeData.feeAmount,
          gstAmount,
          totalAmount,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        { onConflict: 'applicationId' }
      )
      .select()
      .single();

    if (error) throw error;

    await this.logAudit({
      entityType: 'DOCUMENT',
      entityId: applicationId,
      action: 'PROCESSING_FEE_SET',
      performedBy: bankUser.email,
      role: bankUser.role,
      details: { feeAmount: feeData.feeAmount, gstAmount, totalAmount }
    });

    return data;
  }

  async updateProcessingFeeStatus(applicationId: string, status: string, details: any): Promise<any> {
    const update: any = { status };

    if (status === 'PAID') {
      update.paidAt = new Date().toISOString();
      update.paymentMode = details.paymentMode;
      update.paymentRef = details.paymentRef;
    } else if (status === 'WAIVED') {
      update.waivedBy = details.waivedBy;
      update.waiverReason = details.waiverReason;
    }

    const { data, error } = await this.db
      .from('ProcessingFee')
      .update(update)
      .eq('applicationId', applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== QUERIES & RESPONSES ====================

  async raiseQuery(applicationId: string, queryData: any, bankUser: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankQuery')
      .insert({
        applicationId,
        raisedBy: bankUser.email,
        queryType: queryData.queryType,
        description: queryData.description,
        requiredDocs: queryData.requiredDocs,
        status: 'OPEN'
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit({
      entityType: 'LOAN',
      entityId: applicationId,
      action: 'QUERY_RAISED',
      performedBy: bankUser.email,
      role: bankUser.role,
      details: { queryType: queryData.queryType }
    });

    return data;
  }

  async respondToQuery(queryId: string, response: any, bankUser: any): Promise<any> {
    const { data, error } = await this.db
      .from('QueryResponse')
      .insert({
        queryId,
        respondedBy: bankUser.firstName || bankUser.email,
        message: response.message,
        attachments: response.attachments
      })
      .select()
      .single();

    if (error) throw error;

    // Check if all queries are resolved
    const { data: query } = await this.db
      .from('BankQuery')
      .select('applicationId')
      .eq('id', queryId)
      .single();

    await this.logAudit({
      entityType: 'LOAN',
      entityId: query?.applicationId,
      action: 'QUERY_RESPONDED',
      performedBy: bankUser.email,
      role: bankUser.role
    });

    return data;
  }

  async resolveQuery(queryId: string, bankUser: any): Promise<any> {
    const now = new Date().toISOString();

    const { data, error } = await this.db
      .from('BankQuery')
      .update({
        status: 'RESOLVED',
        resolvedAt: now
      })
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit({
      entityType: 'LOAN',
      entityId: data.applicationId,
      action: 'QUERY_RESOLVED',
      performedBy: bankUser.email,
      role: bankUser.role
    });

    return data;
  }

  // ==================== DISBURSEMENT ====================

  async confirmDisbursement(applicationId: string, disbursementData: any, bankUser: any): Promise<any> {
    const { data, error } = await this.db
      .from('Disbursement')
      .insert({
        applicationId,
        trancheNumber: disbursementData.trancheNumber || 1,
        amount: disbursementData.amount,
        mode: disbursementData.mode,
        utrNumber: disbursementData.utrNumber,
        beneficiary: disbursementData.beneficiary,
        status: 'CONFIRMED',
        disbursedAt: new Date().toISOString(),
        confirmedBy: bankUser.email
      })
      .select()
      .single();

    if (error) throw error;

    // Update application status
    await this.db
      .from('LoanApplication')
      .update({
        status: 'disbursed',
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId);

    await this.logAudit({
      entityType: 'DISBURSEMENT',
      entityId: data.id,
      action: 'DISBURSEMENT_CONFIRMED',
      performedBy: bankUser.email,
      role: bankUser.role,
      details: { amount: disbursementData.amount, tranche: disbursementData.trancheNumber }
    });

    return data;
  }

  async getDisbursements(applicationId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('Disbursement')
      .select('*')
      .eq('applicationId', applicationId)
      .order('trancheNumber', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ==================== QUALITY RATING ====================

  async rateFileQuality(applicationId: string, ratingData: any, bankUser: any): Promise<any> {
    const overall = Math.round(
      (ratingData.completeness + ratingData.accuracy + ratingData.clarity) / 3
    );

    const { data, error } = await this.db
      .from('FileQualityRating')
      .upsert(
        {
          applicationId,
          completeness: ratingData.completeness,
          accuracy: ratingData.accuracy,
          clarity: ratingData.clarity,
          overall,
          comments: ratingData.comments,
          ratedBy: bankUser.email
        },
        { onConflict: 'applicationId' }
      )
      .select()
      .single();

    if (error) throw error;

    await this.logAudit({
      entityType: 'DOCUMENT',
      entityId: applicationId,
      action: 'QUALITY_RATED',
      performedBy: bankUser.email,
      role: bankUser.role,
      details: { overall }
    });

    return data;
  }

  // ==================== ANALYTICS ====================

  async getChannelAnalytics(bankId: string): Promise<any> {
    const { data: applications, error } = await this.db
      .from('LoanApplication')
      .select('id, status, amount, createdAt')
      .eq('bank', bankId);

    if (error) throw error;

    const statusCounts = applications.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const totalAmount = applications.reduce((sum: number, app: any) => sum + (app.amount || 0), 0);

    return {
      totalApplications: applications.length,
      statusBreakdown: statusCounts,
      totalAmount,
      averageAmount: applications.length > 0 ? totalAmount / applications.length : 0
    };
  }

  async getRejectionAnalytics(bankId: string): Promise<any> {
    const { data, error } = await this.db
      .from('BankDecision')
      .select('rejectionReason, decidedAt')
      .eq('bankId', bankId)
      .eq('decision', 'REJECTED');

    if (error) throw error;

    const reasonCounts = (data || []).reduce((acc: any, decision: any) => {
      const reason = decision.rejectionReason || 'UNSPECIFIED';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRejections: data?.length || 0,
      reasonBreakdown: reasonCounts,
      rejectionRate: 0 // Calculate based on total applications
    };
  }

  async getPipelineAnalytics(bankId: string): Promise<any> {
    const stages = ['submitted', 'file_logged', 'under_bank_review', 'sanctioned', 'disbursed', 'rejected'];

    const { data, error } = await this.db
      .from('LoanApplication')
      .select('status, amount')
      .eq('bank', bankId);

    if (error) throw error;

    const pipeline = stages.map(stage => {
      const stageData = data.filter(app => app.status === stage);
      return {
        stage,
        count: stageData.length,
        totalAmount: stageData.reduce((sum: number, app: any) => sum + (app.amount || 0), 0)
      };
    });

    return pipeline;
  }

  async getAgingReport(bankId: string): Promise<any> {
    const { data: applications, error } = await this.db
      .from('LoanApplication')
      .select('id, createdAt, status')
      .eq('bank', bankId);

    if (error) throw error;

    const now = new Date();
    const ageGroups = {
      '0-7_days': 0,
      '8-30_days': 0,
      '31-60_days': 0,
      '60+_days': 0
    };

    applications.forEach(app => {
      const created = new Date(app.createdAt);
      const ageDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

      if (ageDays <= 7) ageGroups['0-7_days']++;
      else if (ageDays <= 30) ageGroups['8-30_days']++;
      else if (ageDays <= 60) ageGroups['31-60_days']++;
      else ageGroups['60+_days']++;
    });

    return ageGroups;
  }

  async getSLAMetrics(bankId: string): Promise<any> {
    const { data: decisions, error } = await this.db
      .from('BankDecision')
      .select('applicationId, decidedAt')
      .eq('bankId', bankId);

    if (error) throw error;

    // Calculate average TAT for different stages
    const avgDecisionTime = decisions?.reduce((sum: number, d: any) => {
      const decidedAt = new Date(d.decidedAt).getTime();
      return sum + decidedAt;
    }, 0) / (decisions?.length || 1);

    return {
      totalDecisions: decisions?.length || 0,
      averageTAT: Math.floor((new Date().getTime() - avgDecisionTime) / (1000 * 60 * 60 * 24)) + ' days'
    };
  }

  // ==================== AUDIT LOG ====================

  private async logAudit(auditData: any): Promise<void> {
    await this.db.from('AuditLog').insert({
      entityType: auditData.entityType,
      entityId: auditData.entityId,
      action: auditData.action,
      performedBy: auditData.performedBy,
      role: auditData.role,
      details: auditData.details,
      createdAt: new Date().toISOString()
    });
  }

  async getAuditLogs(applicationId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('AuditLog')
      .select('*')
      .eq('entityId', applicationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
