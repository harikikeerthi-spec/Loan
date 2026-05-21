import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BankService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  // ─── Helper: derive bankId from the requesting user ──────────────────────────
  private getBankId(bankUser: any): string {
    return bankUser?.bankId || bankUser?.organisation || bankUser?.id || 'unknown';
  }

  // ─── Helper: log to AuditLog (fire-and-forget, never throws) ─────────────────
  private async audit(
    entityType: string,
    entityId: string,
    action: string,
    performedBy: string,
    details?: any,
  ) {
    try {
      await this.db.from('AuditLog').insert({
        entityType,
        entityId,
        action,
        performedBy,
        details: details ? JSON.stringify(details) : null,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[BankService.audit] Non-fatal audit error:', e?.message);
    }
  }

  // ─── 1. getIncomingFiles ──────────────────────────────────────────────────────
  async getIncomingFiles(bankUserId: string, page = 1, limit = 20) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await this.db
        .from('LoanApplication')
        .select('*', { count: 'exact' })
        .in('status', ['submitted', 'processing', 'under_bank_review'])
        .order('createdAt', { ascending: false })
        .range(from, to);

      if (error) throw new InternalServerErrorException(error.message);

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getIncomingFiles]', err?.message);
      return { success: true, data: [], total: 0, page, limit };
    }
  }

  // ─── 2. getIncomingFileDetail ─────────────────────────────────────────────────
  async getIncomingFileDetail(applicationId: string) {
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error || !data) throw new NotFoundException('Application not found');

      // Attempt to fetch attached documents (graceful if table absent)
      let documents: any[] = [];
      try {
        const { data: docs } = await this.db
          .from('ApplicationDocument')
          .select('*')
          .eq('applicationId', applicationId);
        documents = docs || [];
      } catch (_) {
        // table may not exist yet
      }

      return { success: true, data: { ...data, documents } };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 3. logFile ───────────────────────────────────────────────────────────────
  async logFile(
    applicationId: string,
    bankUserId: string,
    data: {
      lanNumber: string;
      assignedOfficer?: string;
      branchId?: string;
      productId?: string;
      notes?: string;
    },
  ) {
    try {
      if (!data.lanNumber) throw new BadRequestException('lanNumber is required');

      const updatePayload: any = {
        lanNumber: data.lanNumber,
        lanEnteredAt: new Date().toISOString(),
        fileLoggedBy: bankUserId,
        status: 'under_bank_review',
      };
      if (data.assignedOfficer) updatePayload.assignedOfficer = data.assignedOfficer;
      if (data.branchId) updatePayload.branchId = data.branchId;
      if (data.productId) updatePayload.productId = data.productId;

      const { data: updated, error } = await this.db
        .from('LoanApplication')
        .update(updatePayload)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);

      await this.audit('LoanApplication', applicationId, 'FILE_LOGGED', bankUserId, {
        lanNumber: data.lanNumber,
        notes: data.notes,
      });

      return { success: true, data: updated };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      )
        throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 4. getMyFiles ────────────────────────────────────────────────────────────
  async getMyFiles(
    bankUserId: string,
    filters: { status?: string; search?: string; page?: number; limit?: number },
  ) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = this.db
        .from('LoanApplication')
        .select('*', { count: 'exact' })
        .not('lanNumber', 'is', null)
        .order('createdAt', { ascending: false })
        .range(from, to);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error, count } = await query;
      if (error) throw new InternalServerErrorException(error.message);

      let results = data || [];
      if (filters.search) {
        const s = filters.search.toLowerCase();
        results = results.filter(
          (a: any) =>
            a.lanNumber?.toLowerCase().includes(s) ||
            a.applicantName?.toLowerCase().includes(s) ||
            a.id?.toLowerCase().includes(s),
        );
      }

      return { success: true, data: results, total: count || results.length, page, limit };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getMyFiles]', err?.message);
      return { success: true, data: [], total: 0, page: filters.page || 1, limit: filters.limit || 20 };
    }
  }

  // ─── 5. getMyFileDetail ───────────────────────────────────────────────────────
  async getMyFileDetail(applicationId: string) {
    try {
      const { data: app, error } = await this.db
        .from('LoanApplication')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error || !app) throw new NotFoundException('Application not found');

      // Fetch related records gracefully
      const [decisions, queries, disbursements] = await Promise.all([
        this.db
          .from('BankDecision')
          .select('*')
          .eq('applicationId', applicationId)
          .then(({ data }) => data || []),
        this.db
          .from('BankQuery')
          .select('*')
          .eq('applicationId', applicationId)
          .then(({ data }) => data || []),
        this.db
          .from('Disbursement')
          .select('*')
          .eq('applicationId', applicationId)
          .then(({ data }) => data || []),
      ]);

      return {
        success: true,
        data: { ...app, decisions, queries, disbursements },
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 6. createDecision ───────────────────────────────────────────────────────
  async createDecision(
    applicationId: string,
    bankUserId: string,
    data: {
      decision: string;
      sanctionAmount?: number;
      interestRate?: number;
      roiType?: string;
      tenure?: number;
      conditions?: string;
      conditionDeadline?: string;
      counterOffer?: string;
      rejectionReason?: string;
      remarks?: string;
    },
  ) {
    try {
      if (!data.decision) throw new BadRequestException('decision is required');

      const { data: decision, error } = await this.db
        .from('BankDecision')
        .insert({
          applicationId,
          bankId: bankUserId,
          decision: data.decision,
          sanctionAmount: data.sanctionAmount || null,
          interestRate: data.interestRate || null,
          roiType: data.roiType || null,
          tenure: data.tenure || null,
          conditions: data.conditions || null,
          conditionDeadline: data.conditionDeadline || null,
          counterOffer: data.counterOffer || null,
          rejectionReason: data.rejectionReason || null,
          remarks: data.remarks || null,
          decidedBy: bankUserId,
          decidedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);

      // Update application status
      const newStatus =
        data.decision === 'APPROVED' || data.decision === 'SANCTIONED'
          ? 'sanctioned'
          : data.decision === 'REJECTED'
          ? 'rejected'
          : 'under_bank_review';

      await this.db
        .from('LoanApplication')
        .update({
          status: newStatus,
          sanctionAmount: data.sanctionAmount || null,
          sanctionDate:
            newStatus === 'sanctioned' ? new Date().toISOString() : null,
        })
        .eq('id', applicationId);

      await this.audit('BankDecision', decision.id, 'DECISION_CREATED', bankUserId, {
        decision: data.decision,
        applicationId,
      });

      return { success: true, data: decision };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 7. amendDecision ────────────────────────────────────────────────────────
  async amendDecision(decisionId: string, bankUserId: string, data: any) {
    try {
      const { data: updated, error } = await this.db
        .from('BankDecision')
        .update({ ...data, decidedAt: new Date().toISOString() })
        .eq('id', decisionId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      if (!updated) throw new NotFoundException('Decision not found');

      await this.audit('BankDecision', decisionId, 'DECISION_AMENDED', bankUserId, data);
      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 8. uploadSanctionLetter ──────────────────────────────────────────────────
  async uploadSanctionLetter(applicationId: string, sanctionLetterUrl: string) {
    try {
      if (!sanctionLetterUrl) throw new BadRequestException('sanctionLetterUrl is required');

      const { data: updated, error } = await this.db
        .from('LoanApplication')
        .update({ sanctionLetterUrl })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 9. setROI ────────────────────────────────────────────────────────────────
  async setROI(
    applicationId: string,
    data: {
      roiType: string;
      roiBase: number;
      roiEffective: number;
      roiSubsidy?: number;
    },
  ) {
    try {
      const { data: updated, error } = await this.db
        .from('LoanApplication')
        .update({
          roiType: data.roiType,
          roiBase: data.roiBase,
          roiEffective: data.roiEffective,
          roiSubsidy: data.roiSubsidy || null,
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 10. setProcessingFee ─────────────────────────────────────────────────────
  async setProcessingFee(
    applicationId: string,
    data: {
      feeAmount: number;
      gstAmount?: number;
      totalAmount: number;
      paymentMode?: string;
    },
  ) {
    try {
      // Fetch lanNumber from application
      const { data: app } = await this.db
        .from('LoanApplication')
        .select('lanNumber')
        .eq('id', applicationId)
        .single();

      const { data: fee, error } = await this.db
        .from('ProcessingFee')
        .insert({
          applicationId,
          lanNumber: app?.lanNumber || null,
          feeAmount: data.feeAmount,
          gstAmount: data.gstAmount || null,
          totalAmount: data.totalAmount,
          paymentMode: data.paymentMode || null,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: fee };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 11. updateProcessingFee ──────────────────────────────────────────────────
  async updateProcessingFee(
    applicationId: string,
    data: {
      status: string;
      paymentRef?: string;
      paidAt?: string;
      waivedBy?: string;
      waiverReason?: string;
    },
  ) {
    try {
      const { data: updated, error } = await this.db
        .from('ProcessingFee')
        .update({
          status: data.status,
          paymentRef: data.paymentRef || null,
          paidAt: data.paidAt || null,
          waivedBy: data.waivedBy || null,
          waiverReason: data.waiverReason || null,
        })
        .eq('applicationId', applicationId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 12. raiseQuery ───────────────────────────────────────────────────────────
  async raiseQuery(
    applicationId: string,
    raisedBy: string,
    data: {
      queryType: string;
      description: string;
      requiredDocs?: string;
    },
  ) {
    try {
      if (!data.description) throw new BadRequestException('description is required');

      const { data: query, error } = await this.db
        .from('BankQuery')
        .insert({
          applicationId,
          raisedBy,
          queryType: data.queryType || 'GENERAL',
          description: data.description,
          requiredDocs: data.requiredDocs || null,
          status: 'OPEN',
          raisedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: query };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 13. getQueries ───────────────────────────────────────────────────────────
  async getQueries(bankUserId: string, status?: string) {
    try {
      let query = this.db
        .from('BankQuery')
        .select('*')
        .eq('raisedBy', bankUserId)
        .order('raisedAt', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: data || [] };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getQueries]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 14. getQueryThread ───────────────────────────────────────────────────────
  async getQueryThread(queryId: string) {
    try {
      const { data: query, error } = await this.db
        .from('BankQuery')
        .select('*')
        .eq('id', queryId)
        .single();

      if (error || !query) throw new NotFoundException('Query not found');

      let responses: any[] = [];
      try {
        const { data: resp } = await this.db
          .from('QueryResponse')
          .select('*')
          .eq('queryId', queryId)
          .order('respondedAt', { ascending: true });
        responses = resp || [];
      } catch (_) {}

      return { success: true, data: { ...query, responses } };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 15. resolveQuery ────────────────────────────────────────────────────────
  async resolveQuery(queryId: string) {
    try {
      const { data: updated, error } = await this.db
        .from('BankQuery')
        .update({ status: 'RESOLVED', resolvedAt: new Date().toISOString() })
        .eq('id', queryId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      if (!updated) throw new NotFoundException('Query not found');

      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 16. getApplicationDocuments ─────────────────────────────────────────────
  async getApplicationDocuments(applicationId: string) {
    try {
      let documents: any[] = [];
      try {
        const { data } = await this.db
          .from('ApplicationDocument')
          .select('*')
          .eq('applicationId', applicationId);
        documents = data || [];
      } catch (_) {
        // Fallback: return sanctionLetterUrl from the application
        const { data: app } = await this.db
          .from('LoanApplication')
          .select('sanctionLetterUrl, id')
          .eq('id', applicationId)
          .single();
        if (app?.sanctionLetterUrl) {
          documents = [{ type: 'sanction_letter', url: app.sanctionLetterUrl }];
        }
      }
      return { success: true, data: documents };
    } catch (err) {
      console.error('[BankService.getApplicationDocuments]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 17. confirmDisbursement ──────────────────────────────────────────────────
  async confirmDisbursement(
    applicationId: string,
    confirmedBy: string,
    data: {
      trancheNumber: number;
      amount: number;
      mode: string;
      utrNumber?: string;
      beneficiary: string;
      disbursedAt: string;
      nextTrancheDue?: string;
      remainingSanction?: number;
    },
  ) {
    try {
      if (!data.amount || !data.beneficiary)
        throw new BadRequestException('amount and beneficiary are required');

      const { data: disbursement, error } = await this.db
        .from('Disbursement')
        .insert({
          applicationId,
          trancheNumber: data.trancheNumber || 1,
          amount: data.amount,
          mode: data.mode,
          utrNumber: data.utrNumber || null,
          beneficiary: data.beneficiary,
          status: 'CONFIRMED',
          disbursedAt: data.disbursedAt,
          confirmedAt: new Date().toISOString(),
          confirmedBy,
          nextTrancheDue: data.nextTrancheDue || null,
          remainingSanction: data.remainingSanction || null,
        })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);

      // Update application status to disbursed
      await this.db
        .from('LoanApplication')
        .update({ status: 'disbursed' })
        .eq('id', applicationId);

      await this.audit('Disbursement', disbursement.id, 'DISBURSEMENT_CONFIRMED', confirmedBy, {
        applicationId,
        amount: data.amount,
        trancheNumber: data.trancheNumber,
      });

      return { success: true, data: disbursement };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 18. getDisbursements ─────────────────────────────────────────────────────
  async getDisbursements(bankUserId: string) {
    try {
      const { data, error } = await this.db
        .from('Disbursement')
        .select('*')
        .eq('confirmedBy', bankUserId)
        .order('confirmedAt', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: data || [] };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getDisbursements]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 19. rateFileQuality ──────────────────────────────────────────────────────
  async rateFileQuality(
    applicationId: string,
    ratedBy: string,
    data: {
      completeness: number;
      accuracy: number;
      clarity: number;
      overall: number;
      comments?: string;
    },
  ) {
    try {
      const { data: rating, error } = await this.db
        .from('FileQualityRating')
        .upsert(
          {
            applicationId,
            completeness: data.completeness,
            accuracy: data.accuracy,
            clarity: data.clarity,
            overall: data.overall,
            comments: data.comments || null,
            ratedBy,
            ratedAt: new Date().toISOString(),
          },
          { onConflict: 'applicationId' },
        )
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: rating };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 20. getChannelAnalytics ──────────────────────────────────────────────────
  async getChannelAnalytics(bankUserId: string) {
    try {
      const [{ count: totalReceived }, { count: totalSanctioned }, { count: totalDisbursed }] =
        await Promise.all([
          this.db
            .from('LoanApplication')
            .select('id', { count: 'exact', head: true })
            .not('lanNumber', 'is', null)
            .then((r) => ({ count: r.count || 0 })),
          this.db
            .from('LoanApplication')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'sanctioned')
            .then((r) => ({ count: r.count || 0 })),
          this.db
            .from('LoanApplication')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'disbursed')
            .then((r) => ({ count: r.count || 0 })),
        ]);

      const conversionRate =
        totalReceived > 0
          ? Math.round((Number(totalSanctioned) / Number(totalReceived)) * 100)
          : 0;

      return {
        success: true,
        data: {
          totalReceived,
          totalSanctioned,
          totalDisbursed,
          conversionRate,
        },
      };
    } catch (err) {
      console.error('[BankService.getChannelAnalytics]', err?.message);
      return {
        success: true,
        data: { totalReceived: 0, totalSanctioned: 0, totalDisbursed: 0, conversionRate: 0 },
      };
    }
  }

  // ─── 21. getRejectionAnalytics ────────────────────────────────────────────────
  async getRejectionAnalytics(bankUserId: string) {
    try {
      const { data, error } = await this.db
        .from('BankDecision')
        .select('rejectionReason')
        .eq('decision', 'REJECTED');

      if (error) throw new InternalServerErrorException(error.message);

      const reasons: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const reason = row.rejectionReason || 'Unspecified';
        reasons[reason] = (reasons[reason] || 0) + 1;
      });

      const breakdown = Object.entries(reasons).map(([reason, count]) => ({
        reason,
        count,
      }));

      return { success: true, data: breakdown };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getRejectionAnalytics]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 22. getPipelineAnalytics ─────────────────────────────────────────────────
  async getPipelineAnalytics(bankUserId: string) {
    try {
      const stages = [
        { label: 'incoming', statuses: ['submitted', 'processing', 'under_bank_review'] },
        { label: 'logged', filter: 'lanNumber' },
        { label: 'sanctioned', statuses: ['sanctioned'] },
        { label: 'disbursed', statuses: ['disbursed'] },
        { label: 'rejected', statuses: ['rejected'] },
      ];

      const results = await Promise.all(
        stages.map(async (stage: any) => {
          let q = this.db
            .from('LoanApplication')
            .select('id', { count: 'exact', head: true });

          if (stage.filter === 'lanNumber') {
            q = q.not('lanNumber', 'is', null);
          } else {
            q = q.in('status', stage.statuses);
          }

          const { count } = await q;
          return { stage: stage.label, count: count || 0 };
        }),
      );

      return { success: true, data: results };
    } catch (err) {
      console.error('[BankService.getPipelineAnalytics]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 23. getAgingReport ───────────────────────────────────────────────────────
  async getAgingReport(bankUserId: string) {
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('id, createdAt, status')
        .not('lanNumber', 'is', null)
        .not('status', 'in', '("disbursed","rejected","cancelled")');

      if (error) throw new InternalServerErrorException(error.message);

      const now = Date.now();
      const buckets: Record<string, number> = {
        '0-7d': 0,
        '8-15d': 0,
        '16-30d': 0,
        '30d+': 0,
      };

      (data || []).forEach((app: any) => {
        const ageDays = Math.floor((now - new Date(app.createdAt).getTime()) / 86400000);
        if (ageDays <= 7) buckets['0-7d']++;
        else if (ageDays <= 15) buckets['8-15d']++;
        else if (ageDays <= 30) buckets['16-30d']++;
        else buckets['30d+']++;
      });

      const report = Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
      return { success: true, data: report };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getAgingReport]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 24. getSLAAnalytics ──────────────────────────────────────────────────────
  async getSLAAnalytics(bankUserId: string) {
    try {
      const SLA_DAYS = 15; // configurable SLA threshold

      const { data, error } = await this.db
        .from('LoanApplication')
        .select('id, createdAt, status, turnaroundDays')
        .not('lanNumber', 'is', null);

      if (error) throw new InternalServerErrorException(error.message);

      const rows = data || [];
      const now = Date.now();

      let withinSLA = 0;
      let overdue = 0;
      let totalTAT = 0;
      let countWithTAT = 0;

      rows.forEach((app: any) => {
        const ageDays =
          app.turnaroundDays ||
          Math.floor((now - new Date(app.createdAt).getTime()) / 86400000);

        if (app.turnaroundDays) {
          totalTAT += app.turnaroundDays;
          countWithTAT++;
        }

        const isResolved = ['sanctioned', 'disbursed', 'rejected'].includes(app.status);
        if (!isResolved) {
          if (ageDays <= SLA_DAYS) withinSLA++;
          else overdue++;
        }
      });

      return {
        success: true,
        data: {
          avgTurnaroundDays: countWithTAT > 0 ? Math.round(totalTAT / countWithTAT) : null,
          withinSLA,
          overdue,
          slaDays: SLA_DAYS,
          totalTracked: rows.length,
        },
      };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getSLAAnalytics]', err?.message);
      return {
        success: true,
        data: { avgTurnaroundDays: null, withinSLA: 0, overdue: 0, slaDays: 15, totalTracked: 0 },
      };
    }
  }

  // ─── 25. getProducts ──────────────────────────────────────────────────────────
  async getProducts(bankUserId: string) {
    try {
      const { data, error } = await this.db
        .from('BankProduct')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: data || [] };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getProducts]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 26. createProduct ────────────────────────────────────────────────────────
  async createProduct(bankUserId: string, data: any) {
    try {
      const { data: product, error } = await this.db
        .from('BankProduct')
        .insert({ ...data, bankId: bankUserId, createdAt: new Date().toISOString() })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: product };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 27. updateProduct ────────────────────────────────────────────────────────
  async updateProduct(productId: string, data: any) {
    try {
      const { data: updated, error } = await this.db
        .from('BankProduct')
        .update(data)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      if (!updated) throw new NotFoundException('Product not found');
      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 28. getBranches ──────────────────────────────────────────────────────────
  async getBranches(bankUserId: string) {
    try {
      const { data, error } = await this.db
        .from('BankBranch')
        .select('*')
        .order('branchName', { ascending: true });

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: data || [] };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getBranches]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 29. createBranch ────────────────────────────────────────────────────────
  async createBranch(bankUserId: string, data: any) {
    try {
      const { data: branch, error } = await this.db
        .from('BankBranch')
        .insert({ ...data, bankId: bankUserId })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: branch };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 30. getOfficers ──────────────────────────────────────────────────────────
  async getOfficers(bankUserId: string) {
    try {
      // Get current user's bank context
      const { data: me } = await this.db
        .from('User')
        .select('bankId, firstName, organisation')
        .eq('id', bankUserId)
        .single();

      let query = this.db
        .from('User')
        .select('id, firstName, lastName, email, mobile, role, bankId, organisation')
        .in('role', ['bank', 'partner_bank']);

      // Filter by same bank if bankId is available
      if (me?.bankId) {
        query = query.eq('bankId', me.bankId);
      } else if (me?.organisation) {
        query = query.eq('organisation', me.organisation);
      }

      const { data, error } = await query;
      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: data || [] };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getOfficers]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 31. exportApplications ───────────────────────────────────────────────────
  async exportApplications(bankUserId: string, format = 'json') {
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('*')
        .not('lanNumber', 'is', null)
        .order('createdAt', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);

      // Client handles CSV/Excel formatting; we return raw JSON
      return { success: true, data: data || [], format };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 32. getNotifications ────────────────────────────────────────────────────
  async getNotifications(bankUserId: string) {
    try {
      const { data, error } = await this.db
        .from('AuditLog')
        .select('*')
        .eq('performedBy', bankUserId)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: data || [] };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('[BankService.getNotifications]', err?.message);
      return { success: true, data: [] };
    }
  }

  // ─── 33. markNotificationRead ────────────────────────────────────────────────
  async markNotificationRead(notificationId: string) {
    try {
      const { data: updated, error } = await this.db
        .from('AuditLog')
        .update({ details: JSON.stringify({ read: true, readAt: new Date().toISOString() }) })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { success: true, data: updated };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }

  // ─── 34. submitFeedback ───────────────────────────────────────────────────────
  async submitFeedback(bankUserId: string, data: any) {
    try {
      // Log feedback as an audit entry (no separate feedback table required yet)
      await this.audit('Feedback', bankUserId, 'FEEDBACK_SUBMITTED', bankUserId, data);
      return { success: true, message: 'Feedback submitted successfully' };
    } catch (err) {
      console.error('[BankService.submitFeedback]', err?.message);
      return { success: true, message: 'Feedback recorded' };
    }
  }

  // ─── Bonus: getByLan ──────────────────────────────────────────────────────────
  async getByLan(lan: string) {
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('*')
        .eq('lanNumber', lan)
        .single();

      if (error || !data) throw new NotFoundException(`Application with LAN ${lan} not found`);
      return { success: true, data };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(err?.message);
    }
  }
}
