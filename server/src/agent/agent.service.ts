import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AgentService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private readonly supabase: SupabaseService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // PII masking helpers
  private maskEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const [local, domain] = parts;
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  private maskPhone(phone: string): string {
    if (!phone) return '';
    if (phone.length <= 4) return '******';
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  private maskApplicationPII(app: any) {
    const masked = { ...app };
    if (masked.email) masked.email = this.maskEmail(masked.email);
    if (masked.phoneNumber) masked.phoneNumber = this.maskPhone(masked.phoneNumber);
    if (masked.phone) masked.phone = this.maskPhone(masked.phone);
    if (masked.dateOfBirth) masked.dateOfBirth = 'XX-XX-XXXX';
    if (masked.dob) masked.dob = 'XX-XX-XXXX';
    if (masked.coApplicantMobile) masked.coApplicantMobile = this.maskPhone(masked.coApplicantMobile);
    if (masked.user) {
      masked.user = { ...masked.user };
      if (masked.user.email) masked.user.email = this.maskEmail(masked.user.email);
      if (masked.user.phoneNumber) masked.user.phoneNumber = this.maskPhone(masked.user.phoneNumber);
    }
    return masked;
  }

  private async getRefereeIds(agentId: string): Promise<string[]> {
    const { data: referrals } = await this.db
      .from('Referral')
      .select('refereeId')
      .eq('referrerId', agentId);
    return (referrals || []).map(r => r.refereeId).filter(Boolean);
  }

  async getDashboardSummary(agentId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    if (refereeIds.length === 0) {
      return {
        totalLeads: 0,
        totalAmount: 0,
        disbursedAmount: 0,
        revenue: 0,
        activeCount: 0,
      };
    }

    const { data: applications } = await this.db
      .from('LoanApplication')
      .select('*')
      .in('userId', refereeIds);

    let totalAmount = 0;
    let disbursedAmount = 0;
    let activeCount = 0;

    for (const app of applications || []) {
      const amt = parseFloat(app.amount) || 0;
      totalAmount += amt;
      if (app.status === 'disbursed') {
        disbursedAmount += amt;
      }
      if (!['disbursed', 'rejected', 'cancelled'].includes(app.status)) {
        activeCount++;
      }
    }

    // Agent revenue model: 0.7% on disbursed amount
    const revenue = disbursedAmount * 0.007;

    return {
      totalLeads: (applications || []).length,
      totalAmount,
      disbursedAmount,
      revenue,
      activeCount,
    };
  }

  async getDashboardPipeline(agentId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    const counts = {
      leads: 0,
      submitted: 0,
      bank_review: 0,
      approved: 0,
      disbursed: 0,
    };

    if (refereeIds.length === 0) return counts;

    const { data: applications } = await this.db
      .from('LoanApplication')
      .select('status')
      .in('userId', refereeIds);

    for (const app of applications || []) {
      const status = app.status ? app.status.toLowerCase() : 'pending';
      if (status === 'disbursed') counts.disbursed++;
      else if (status === 'approved') counts.approved++;
      else if (['processing', 'bank_review'].includes(status)) counts.bank_review++;
      else if (['submitted', 'application_submitted'].includes(status)) counts.submitted++;
      else counts.leads++;
    }

    return counts;
  }

  async getDashboardActivity(agentId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    if (refereeIds.length === 0) return [];

    const { data: applications } = await this.db
      .from('LoanApplication')
      .select('id, applicationNumber, firstName, lastName')
      .in('userId', refereeIds);

    if (!applications || applications.length === 0) return [];

    const appIds = applications.map(a => a.id);
    const { data: history } = await this.db
      .from('ApplicationStatusHistory')
      .select('*')
      .in('applicationId', appIds)
      .order('createdAt', { ascending: false })
      .limit(10);

    const appMap = new Map(applications.map(a => [a.id, a]));

    return (history || []).map(h => {
      const app = appMap.get(h.applicationId);
      const studentName = app ? `${app.firstName || ''} ${app.lastName || ''}`.trim() : 'Student';
      return {
        id: h.id,
        applicationId: h.applicationId,
        applicationNumber: app?.applicationNumber || 'N/A',
        studentName: this.maskEmail(studentName),
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changeReason: h.changeReason,
        createdAt: h.createdAt,
      };
    });
  }

  async getDashboardActionItems(agentId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    if (refereeIds.length === 0) return [];

    const { data: applications } = await this.db
      .from('LoanApplication')
      .select('id, applicationNumber, firstName, lastName, status, remarks')
      .in('userId', refereeIds)
      .in('status', ['query_raised', 'document_rejected', 'pending']);

    return (applications || []).map(app => {
      const studentName = `${app.firstName || ''} ${app.lastName || ''}`.trim();
      let type = 'Follow-Up';
      let notes = app.remarks || 'Application pending review';

      if (app.status === 'query_raised') {
        type = 'Bank Query';
        notes = app.remarks || 'A query has been raised by the bank.';
      } else if (app.status === 'document_rejected') {
        type = 'Doc Chase';
        notes = app.remarks || 'One or more uploaded documents were rejected.';
      }

      return {
        id: app.id,
        type,
        studentName,
        dateTime: new Date().toISOString(),
        notes,
        isOverdue: false,
        isCompleted: false,
      };
    });
  }

  async getLeads(
    agentId: string,
    search?: string,
    status?: string,
    loanType?: string,
    page?: number,
    limit?: number,
  ) {
    const refereeIds = await this.getRefereeIds(agentId);
    if (refereeIds.length === 0) return { leads: [], totalCount: 0 };

    let query = this.db
      .from('LoanApplication')
      .select('*, user:User!userId(*)', { count: 'exact' })
      .in('userId', refereeIds);

    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,applicationNumber.ilike.%${search}%`);
    }

    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }

    if (loanType && loanType !== 'All') {
      query = query.eq('loanType', loanType);
    }

    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { data, count, error } = await query
      .order('updatedAt', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    const maskedLeads = (data || []).map(app => this.maskApplicationPII(app));

    return {
      leads: maskedLeads,
      totalCount: count || 0,
    };
  }

  async createLead(agentId: string, data: any) {
    const email = data.email?.toLowerCase().trim();
    if (!email) throw new BadRequestException('Email is required');

    // 1. Check if user already exists or create new
    let user = await this.usersService.findOne(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: 'user',
      });
    }

    // 2. Record referral map
    const { data: existingReferral } = await this.db
      .from('Referral')
      .select('id')
      .eq('refereeEmail', email)
      .single();

    if (!existingReferral) {
      await this.db.from('Referral').insert({
        referrerId: agentId,
        refereeEmail: email,
        refereeId: user.id,
        status: 'signed_up',
      });
    }

    // 3. Create LoanApplication
    const estimatedCompletionAt = new Date();
    estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);

    const applicationNumber = await this.usersService.generateApplicationNumber();

    const { data: application, error: appError } = await this.db
      .from('LoanApplication')
      .insert({
        applicationNumber,
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: email,
        phone: data.phoneNumber || null,
        bank: data.bank || 'Avanse',
        loanType: data.loanType || 'Domestic',
        amount: parseFloat(data.amount) || 0,
        courseName: data.courseName || null,
        universityName: data.collegeName || null,
        status: 'submitted',
        stage: 'application_submitted',
        progress: 10,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedCompletionAt: estimatedCompletionAt.toISOString(),
      })
      .select()
      .single();

    if (appError) throw appError;

    // Emit live dashboard activity event for lead submission
    try {
      const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || email || 'Student';
      this.eventEmitter.emit('dashboard.activity', {
        type: 'application',
        msg: `Agent submitted lead for Student ${name} (Application #${applicationNumber || application.id.slice(-4)}) for review.`,
        icon: 'rocket_launch',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        actorName: name,
        actorEmail: email,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      // Ignore activity emit failure
    }

    // Emit event-driven notifications
    this.eventEmitter.emit('application.created', {
      applicationId: application.id,
      userId: user.id,
      email: email,
    });
    this.eventEmitter.emit('application.submitted', {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      userId: user.id,
      candidateName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || email || 'Student',
      candidateEmail: email,
      bank: application.bank,
      loanAmount: application.amount,
      loanType: application.loanType,
      submittedAt: application.submittedAt || new Date().toISOString(),
    });

    return { success: true, application };
  }

  async bulkImport(agentId: string, leads: any[]) {
    const results: any[] = [];
    for (const lead of leads) {
      try {
        const res = await this.createLead(agentId, lead);
        results.push({ email: lead.email, success: true, id: res.application?.id });
      } catch (err) {
        results.push({ email: lead.email, success: false, error: err.message });
      }
    }
    return { success: true, results };
  }

  async checkEligibility(data: any) {
    const amount = Number(data.amount) || 0;
    const age = Number(data.age) || 21;
    const hasCoApplicant = !!data.coApplicant;

    let eligible = true;
    const reasons: string[] = [];

    if (amount > 15000000) {
      eligible = false;
      reasons.push('Requested loan amount exceeds maximum limit of 1.5 Crores.');
    }
    if (age < 18 || age > 35) {
      eligible = false;
      reasons.push('Borrower age must be between 18 and 35 years.');
    }
    if (amount > 750000 && !hasCoApplicant) {
      eligible = false;
      reasons.push('Co-applicant is mandatory for education loans above 7.5 Lakhs.');
    }

    return {
      success: true,
      eligible,
      score: eligible ? 85 : 40,
      reasons: reasons.length > 0 ? reasons : ['Meets core underwriting criteria.'],
    };
  }

  async getLeadDetail(agentId: string, leadId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    
    const { data: application, error } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(*)')
      .eq('id', leadId)
      .single();

    if (error || !application) {
      throw new NotFoundException('Lead not found');
    }

    if (!refereeIds.includes(application.userId)) {
      throw new ForbiddenException('Access denied. This lead does not belong to you.');
    }

    const maskedApp = this.maskApplicationPII(application);

    // Fetch documents
    const documents = await this.usersService.getUserDocuments(application.userId);

    // Fetch ApplicationStatusHistory for Journey
    const { data: history } = await this.db
      .from('ApplicationStatusHistory')
      .select('*')
      .eq('applicationId', leadId)
      .order('createdAt', { ascending: true });

    const journey = (history || []).map(h => {
      const date = new Date(h.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      return {
        date,
        title: h.toStatus ? h.toStatus.replace(/_/g, ' ').toUpperCase() : 'STATUS UPDATE',
        desc: h.changeReason || `Application moved from ${h.fromStatus || 'none'} to ${h.toStatus}`,
        done: true
      };
    });

    if (journey.length === 0) {
      const date = new Date(application.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      journey.push({
        date,
        title: 'LEAD SUBMITTED',
        desc: 'Submitted via Agent Network',
        done: true
      });
    }

    const bankStatus = {
      product: application.bank ? `${application.bank} Scholar Scheme` : 'Pending Partner',
      refNumber: `REF-${String(application.id).slice(-6).toUpperCase()}`,
      submittedOn: application.submittedAt 
        ? new Date(application.submittedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
        : new Date(application.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      tatExpected: '10 working days',
      queryText: application.status === 'query_raised' ? application.remarks : undefined
    };

    const commissionRate = 0.007; // 0.70%
    const projectedCommission = (parseFloat(application.amount) || 0) * commissionRate;

    // Fetch communication logs / notes
    const { data: notes } = await this.db
      .from('ApplicationNote')
      .select('*')
      .eq('applicationId', leadId)
      .order('createdAt', { ascending: false });

    const communicationLog = (notes || []).map(n => {
      const date = new Date(n.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      return {
        sender: n.authorRole || 'Staff',
        timestamp: `${date} ${new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        message: n.content
      };
    });

    return {
      ...maskedApp,
      documents,
      journey,
      bankStatus,
      commissionRate: commissionRate * 100,
      projectedCommission,
      communicationLog
    };
  }

  async getLeadDocuments(agentId: string, leadId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    
    const { data: application, error } = await this.db
      .from('LoanApplication')
      .select('userId')
      .eq('id', leadId)
      .single();

    if (error || !application) throw new NotFoundException('Lead not found');
    if (!refereeIds.includes(application.userId)) {
      throw new ForbiddenException('Access denied. This lead does not belong to you.');
    }

    return this.usersService.getUserDocuments(application.userId);
  }

  async getLeadChecklist(agentId: string, leadId: string) {
    const documents = await this.getLeadDocuments(agentId, leadId);
    const REQUIRED_DOCS = [
      { docType: "identity_proof", docName: "Identity Proof (Aadhar/Passport)" },
      { docType: "pan_card", docName: "PAN Card" },
      { docType: "marksheet_10th", docName: "10th Marksheet" },
      { docType: "marksheet_12th", docName: "12th Marksheet" },
      { docType: "admission_letter", docName: "Admission Letter" },
      { docType: "bank_statement", docName: "6-Month Bank Statement" },
      { docType: "income_proof", docName: "Income Certificate" },
      { docType: "fee_structure", docName: "Fee Structure" },
      { docType: "photo", docName: "Passport Photo" }
    ];

    return REQUIRED_DOCS.map(req => {
      const existing = documents.find(d => d.docType === req.docType);
      return {
        docType: req.docType,
        docName: req.docName,
        status: existing ? (existing.status || "uploaded") : "not_uploaded",
        rejectionReason: existing?.rejectionReason || existing?.verificationMetadata?.rejectionReason || ""
      };
    });
  }

  async shareUploadLink(agentId: string, leadId: string, body: any) {
    const refereeIds = await this.getRefereeIds(agentId);
    const { data: application, error } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(*)')
      .eq('id', leadId)
      .single();

    if (error || !application) throw new NotFoundException('Lead not found');
    if (!refereeIds.includes(application.userId)) {
      throw new ForbiddenException('Access denied. This lead does not belong to you.');
    }

    const studentEmail = application.email;
    const channel = body.channel || 'Email';
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/onboarding?studentId=${leadId}`;
    
    try {
      await this.db.from('data_access_logs').insert({
        accessedBy: agentId,
        applicationId: leadId,
        action: `Agent shared onboarding/upload link via ${channel} to ${studentEmail}`,
        accessedAt: new Date().toISOString()
      });
    } catch (e) {
      // Ignore
    }

    return {
      success: true,
      message: `Upload link successfully shared via ${channel}`,
      shareUrl
    };
  }

  async getCommissionsSummary(agentId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    if (refereeIds.length === 0) {
      return {
        gross: 0,
        tds: 0,
        net: 0,
        nextPayoutDate: '01-Jul-2026',
        payouts: []
      };
    }

    const { data: applications } = await this.db
      .from('LoanApplication')
      .select('id, amount, status')
      .in('userId', refereeIds)
      .eq('status', 'disbursed');

    const gross = (applications || []).reduce((sum, app) => sum + (parseFloat(app.amount) || 0) * 0.007, 0);
    const tds = gross * 0.10;
    const net = gross - tds;

    return {
      gross,
      tds,
      net,
      nextPayoutDate: '01-Jul-2026',
      payouts: [
        { period: 'June 2026', gross, tds, net, status: 'Pending Approval' }
      ]
    };
  }

  async getCommissionsLedger(agentId: string) {
    const refereeIds = await this.getRefereeIds(agentId);
    if (refereeIds.length === 0) return [];

    const { data: applications } = await this.db
      .from('LoanApplication')
      .select('id, firstName, lastName, bank, amount, status')
      .in('userId', refereeIds);

    return (applications || []).map(app => {
      const amt = parseFloat(app.amount) || 0;
      const rate = 0.007; // 0.70%
      const commission = amt * rate;
      return {
        studentName: `${app.firstName || ''} ${app.lastName || ''}`.trim(),
        bank: app.bank || 'Pending Partner',
        disbursedAmount: amt,
        commissionRate: rate * 100,
        totalCommission: commission,
        payoutStatus: app.status === 'disbursed' ? 'Paid' : 'Pending Sanction'
      };
    });
  }

  async getCommissionsPayouts(agentId: string) {
    return [
      { period: 'May 2026', paidDate: '01-Jun-2026', utr: 'UTR12345', amount: 54000 },
      { period: 'Apr 2026', paidDate: '01-May-2026', utr: 'UTR12298', amount: 43200 },
      { period: 'Mar 2026', paidDate: '01-Apr-2026', utr: 'UTR11990', amount: 64800 }
    ];
  }

  async getCommissionsRateCard() {
    return {
      tier: 'Master Tier 🥇',
      bonus: '+0.20% bonus structure',
      nextMilestone: 'FRANCHISE (26+ sanctions/month)',
      rates: [
        { name: 'Domestic Loan < ₹10L', rate: '0.70% (0.50% Base + 0.20% Bonus)' },
        { name: 'Domestic Loan ₹10L–₹20L', rate: '0.80% (0.60% Base + 0.20% Bonus)' },
        { name: 'Domestic Loan > ₹20L', rate: '0.95% (0.75% Base + 0.20% Bonus)' },
        { name: 'Abroad Loan (Any amount)', rate: '1.00% (0.80% Base + 0.20% Bonus)' },
        { name: 'Collateral Loan', rate: '0.60% (0.40% Base + 0.20% Bonus)' }
      ]
    };
  }
}
