import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DigilockerService } from '../integration/digilocker.service';
import { DocumentVerificationService } from '../ai/services/document-verification.service';
import { ApplicationReviewService } from '../ai/services/application-review.service';

const APPLICATION_STAGES = {
  application_submitted: { order: 1, label: 'Application Submitted', progress: 10 },
  document_verification: { order: 2, label: 'Document Verification', progress: 30 },
  credit_check: { order: 3, label: 'Credit Check', progress: 50 },
  bank_review: { order: 4, label: 'Bank Review', progress: 70 },
  sanction: { order: 5, label: 'Sanction', progress: 90 },
  disbursement: { order: 6, label: 'Disbursement', progress: 100 },
};

const REQUIRED_DOCUMENTS = {
  education: [
    { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/Passport)', isRequired: true },
    { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
    { docType: 'photo', docName: 'Passport Size Photo', isRequired: true },
    { docType: 'admission_letter', docName: 'Admission Letter', isRequired: true },
    { docType: 'fee_structure', docName: 'Fee Structure', isRequired: true },
    { docType: 'academic_records', docName: '10th & 12th Marksheets', isRequired: true },
    { docType: 'income_proof', docName: 'Co-Applicant Income Proof', isRequired: false },
    { docType: 'bank_statement', docName: 'Bank Statements (6 months)', isRequired: false },
  ],
  home: [
    { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
    { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
    { docType: 'income_proof', docName: 'Income Proof', isRequired: true },
    { docType: 'bank_statement', docName: 'Bank Statements (6 months)', isRequired: true },
    { docType: 'property_documents', docName: 'Property Documents', isRequired: true },
    { docType: 'salary_slips', docName: 'Salary Slips (3 months)', isRequired: true },
  ],
  personal: [
    { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
    { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
    { docType: 'income_proof', docName: 'Income Proof', isRequired: true },
    { docType: 'bank_statement', docName: 'Bank Statements (3 months)', isRequired: true },
  ],
  business: [
    { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
    { docType: 'address_proof', docName: 'Business Address Proof', isRequired: true },
    { docType: 'business_registration', docName: 'Business Registration', isRequired: true },
    { docType: 'financial_statements', docName: 'Financial Statements', isRequired: true },
    { docType: 'bank_statement', docName: 'Bank Statements (12 months)', isRequired: true },
    { docType: 'itr', docName: 'ITR (3 years)', isRequired: true },
  ],
  vehicle: [
    { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
    { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
    { docType: 'income_proof', docName: 'Income Proof', isRequired: true },
    { docType: 'bank_statement', docName: 'Bank Statements (3 months)', isRequired: true },
    { docType: 'vehicle_quotation', docName: 'Vehicle Quotation', isRequired: true },
  ],
};

@Injectable()
export class ApplicationService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private digilockerService: DigilockerService,
    private verificationService: DocumentVerificationService,
    private applicationReviewService: ApplicationReviewService,
  ) { }

  private parseDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;

    // Try native parsing first
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();

    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
    }

    return null;
  }


  async createApplication(userId: string, data: any) {
    const applicationNumber = this.generateApplicationNumber(data.loanType);
    const estimatedCompletionAt = new Date();
    estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);

    const { data: application, error } = await this.db
      .from('LoanApplication')
      .insert({
        applicationNumber,
        userId,
        bank: data.bank,
        loanType: data.loanType,
        amount: parseFloat(data.amount),
        tenure: data.tenure ? parseInt(data.tenure) : null,
        purpose: data.purpose,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: this.parseDate(data.dateOfBirth),

        gender: data.gender,
        nationality: data.nationality,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        employmentType: data.employmentType,
        employerName: data.employerName,
        jobTitle: data.jobTitle,
        annualIncome: data.annualIncome ? parseFloat(data.annualIncome) : null,
        workExperience: data.workExperience ? parseInt(data.workExperience) : null,
        universityName: data.universityName,
        courseName: data.courseName,
        courseDuration: data.courseDuration ? parseInt(data.courseDuration) : null,
        courseStartDate: this.parseDate(data.courseStartDate),

        admissionStatus: data.admissionStatus,
        hasCoApplicant: data.hasCoApplicant || false,
        coApplicantName: data.coApplicantName,
        coApplicantRelation: data.coApplicantRelation,
        coApplicantPhone: data.coApplicantPhone,
        coApplicantEmail: data.coApplicantEmail,
        coApplicantIncome: data.coApplicantIncome ? parseFloat(data.coApplicantIncome) : null,
        fatherName: data.fatherName,
        fatherPhone: data.fatherPhone,
        fatherEmail: data.fatherEmail,
        motherName: data.motherName,
        motherPhone: data.motherPhone,
        motherEmail: data.motherEmail,
        hasCollateral: data.hasCollateral || false,
        collateralType: data.collateralType,
        collateralValue: data.collateralValue ? parseFloat(data.collateralValue) : null,
        collateralDetails: data.collateralDetails,
        status: data.status || 'draft',
        stage: 'application_submitted',
        progress: 10,
        estimatedCompletionAt: estimatedCompletionAt.toISOString(),
      })
      .select('*, user:User!userId(id, email, firstName, lastName)')
      .single();

    if (error) throw error;

    await this.createStatusHistory(application.id, { toStatus: application.status, toStage: application.stage, notes: 'Application created', isAutomatic: true });
    await this.initializeRequiredDocuments(application.id, data.loanType);

    return { success: true, data: application, message: 'Application created successfully' };
  }

  async submitApplication(applicationId: string, userId: string) {
    const application = await this.getApplicationById(applicationId);
    if (application.userId !== userId) throw new BadRequestException('Unauthorized to submit this application');
    if (application.status !== 'draft') throw new BadRequestException('Only draft applications can be submitted');

    const { data: updated, error } = await this.db
      .from('LoanApplication')
      .update({ status: 'submitted', submittedAt: new Date().toISOString(), progress: 15 })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    await this.createStatusHistory(applicationId, { fromStatus: 'draft', toStatus: 'submitted', notes: 'Application submitted for review', isAutomatic: true });
    return { success: true, data: updated, message: 'Application submitted successfully' };
  }

  async getApplicationById(applicationId: string) {
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, email, firstName, lastName, phoneNumber), documents:ApplicationDocument(*), statusHistory:ApplicationStatusHistory(*), notes:ApplicationNote(id, content, type, isInternal, createdAt)')
      .eq('id', applicationId)
      .single();

    if (!application) throw new NotFoundException('Application not found');

    // Sort nested arrays
    if (application.documents) application.documents.sort((a: any, b: any) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
    if (application.statusHistory) application.statusHistory.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (application.notes) application.notes = application.notes.filter((n: any) => !n.isInternal).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return application;
  }

  async getApplicationByNumber(applicationNumber: string) {
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, email, firstName, lastName), documents:ApplicationDocument(*), statusHistory:ApplicationStatusHistory(*)')
      .eq('applicationNumber', applicationNumber)
      .single();

    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async getUserApplications(userId: string, filters?: { status?: string; loanType?: string; limit?: number; offset?: number }) {
    let query = this.db
      .from('LoanApplication')
      .select('*, documents:ApplicationDocument(id, docType, status)', { count: 'exact' })
      .eq('userId', userId)
      .order('date', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.loanType) query = query.eq('loanType', filters.loanType);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data: applications, count } = await query;
    return { success: true, data: applications || [], pagination: { total: count || 0, limit: filters?.limit || 20, offset: filters?.offset || 0 } };
  }

  async updateApplication(applicationId: string, userId: string, data: any) {
    const application = await this.getApplicationById(applicationId);
    if (application.userId !== userId) throw new BadRequestException('Unauthorized to update this application');
    if (!['draft', 'documents_pending'].includes(application.status)) throw new BadRequestException('Application cannot be modified in current status');

    const updatePayload: any = {
      ...data,
      amount: data.amount ? parseFloat(data.amount) : undefined,
      tenure: data.tenure ? parseInt(data.tenure) : undefined,
      annualIncome: data.annualIncome ? parseFloat(data.annualIncome) : undefined,
      dateOfBirth: data.dateOfBirth ? this.parseDate(data.dateOfBirth) : undefined,
      courseStartDate: data.courseStartDate ? this.parseDate(data.courseStartDate) : undefined,

    };

    const { data: updated, error } = await this.db
      .from('LoanApplication')
      .update(updatePayload)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: updated, message: 'Application updated successfully' };
  }

  async cancelApplication(applicationId: string, userId: string, reason?: string) {
    const application = await this.getApplicationById(applicationId);
    if (application.userId !== userId) throw new BadRequestException('Unauthorized to cancel this application');
    if (['approved', 'disbursed', 'cancelled'].includes(application.status)) throw new BadRequestException('Application cannot be cancelled in current status');

    const { data: updated } = await this.db.from('LoanApplication').update({ status: 'cancelled', remarks: reason }).eq('id', applicationId).select().single();
    await this.createStatusHistory(applicationId, { fromStatus: application.status, toStatus: 'cancelled', notes: reason || 'Application cancelled by user', isAutomatic: false });
    return { success: true, data: updated, message: 'Application cancelled successfully' };
  }

  async getApplicationTracking(applicationId: string, userId?: string) {
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('*, statusHistory:ApplicationStatusHistory(*), documents:ApplicationDocument(id, docType, docName, status)')
      .eq('id', applicationId)
      .single();

    if (!application) throw new NotFoundException('Application not found');
    if (userId && application.userId !== userId) throw new BadRequestException('Unauthorized to view this application');

    const statusHistory = (application.statusHistory || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const stages = Object.entries(APPLICATION_STAGES).map(([key, value]) => {
      const currentStageOrder = APPLICATION_STAGES[application.stage as keyof typeof APPLICATION_STAGES]?.order || 0;
      const isCompleted = value.order < currentStageOrder;
      const isCurrent = key === application.stage;
      return { key, label: value.label, order: value.order, isCompleted, isCurrent, completedAt: isCompleted ? statusHistory.find((h: any) => h.toStage === key)?.createdAt : null };
    });

    const docs = application.documents || [];
    const documentsStatus = {
      total: docs.length,
      pending: docs.filter((d: any) => d.status === 'pending').length,
      verified: docs.filter((d: any) => d.status === 'verified').length,
      rejected: docs.filter((d: any) => d.status === 'rejected').length,
    };

    return {
      success: true,
      data: { applicationId: application.id, applicationNumber: application.applicationNumber, status: application.status, currentStage: application.stage, progress: application.progress, stages, timeline: statusHistory, documents: documentsStatus, estimatedCompletion: application.estimatedCompletionAt, submittedAt: application.submittedAt, lastUpdated: application.updatedAt },
    };
  }

  async trackApplication(applicationNumber: string) {
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('id, applicationNumber, loanType, bank, amount, status, stage, progress, submittedAt, estimatedCompletionAt, updatedAt')
      .eq('applicationNumber', applicationNumber)
      .single();

    if (!application) throw new NotFoundException('Application not found');

    const stages = Object.entries(APPLICATION_STAGES).map(([key, value]) => {
      const currentStageOrder = APPLICATION_STAGES[application.stage as keyof typeof APPLICATION_STAGES]?.order || 0;
      return { key, label: value.label, order: value.order, isCompleted: value.order < currentStageOrder, isCurrent: key === application.stage };
    });

    return { success: true, data: { ...application, stages } };
  }

  private async initializeRequiredDocuments(applicationId: string, loanType: string) {
    const requiredDocs = REQUIRED_DOCUMENTS[loanType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal;
    for (const doc of requiredDocs) {
      await this.db.from('ApplicationDocument').insert({ applicationId, docType: doc.docType, docName: doc.docName, fileName: '', filePath: '', status: 'pending', isRequired: doc.isRequired });
    }
  }

  async uploadDocument(applicationId: string, userId: string, documentData: { docType: string; docName: string; fileName: string; filePath: string; fileSize?: number; mimeType?: string }) {
    const application = await this.getApplicationById(applicationId);
    if (application.userId !== userId) throw new BadRequestException('Unauthorized to upload documents');

    const { data: existingDoc } = await this.db.from('ApplicationDocument').select('id').eq('applicationId', applicationId).eq('docType', documentData.docType).single();

    let document: any;
    if (existingDoc) {
      const { data, error } = await this.db.from('ApplicationDocument').update({ ...documentData, status: 'pending', uploadedAt: new Date().toISOString() }).eq('id', existingDoc.id).select().single();
      if (error) throw error;
      document = data;
    } else {
      const { data, error } = await this.db.from('ApplicationDocument').insert({ applicationId, ...documentData, status: 'pending' }).select().single();
      if (error) throw error;
      document = data;
    }

    try {
      const verificationResult = await this.digilockerService.verifyDocument(document.filePath, document.docType);
      let updateData: any = {};
      if (verificationResult.isValid) {
        updateData = { status: 'verified', digilockerTxId: verificationResult.txId, verifiedAt: new Date().toISOString(), verifiedBy: 'Digilocker System', verificationMetadata: verificationResult.details };
      } else {
        const explanation = await this.verificationService.explainRejection(document.docType, verificationResult.code || 'Unknown Error');
        updateData = { status: 'rejected', aiExplanation: explanation, rejectionReason: verificationResult.code || 'Verification Failed', verificationMetadata: verificationResult.details };
      }
      const { data: updated } = await this.db.from('ApplicationDocument').update(updateData).eq('id', document.id).select().single();
      document = updated;
    } catch (error) {
      console.error('Document verification process failed:', error);
    }

    return { success: true, data: document, message: 'Document uploaded successfully' };
  }

  async getApplicationDocuments(applicationId: string, userId?: string) {
    if (userId) {
      const application = await this.getApplicationById(applicationId);
      if (application.userId !== userId) throw new BadRequestException('Unauthorized to view documents');
    }

    const { data: documents } = await this.db.from('ApplicationDocument').select('*').eq('applicationId', applicationId).order('uploadedAt', { ascending: false });

    const docs = documents || [];
    const grouped = {
      pending: docs.filter((d: any) => d.status === 'pending' && d.filePath),
      verified: docs.filter((d: any) => d.status === 'verified'),
      rejected: docs.filter((d: any) => d.status === 'rejected'),
      notUploaded: docs.filter((d: any) => !d.filePath),
    };

    return { success: true, data: docs, grouped, summary: { total: docs.length, uploaded: docs.filter((d: any) => d.filePath).length, pending: grouped.pending.length, verified: grouped.verified.length, rejected: grouped.rejected.length, notUploaded: grouped.notUploaded.length } };
  }

  async deleteDocument(documentId: string, userId: string) {
    const { data: document } = await this.db
      .from('ApplicationDocument')
      .select('*, application:LoanApplication!applicationId(userId)')
      .eq('id', documentId)
      .single();

    if (!document) throw new NotFoundException('Document not found');
    if (document.application.userId !== userId) throw new BadRequestException('Unauthorized to delete this document');
    if (document.status === 'verified') throw new BadRequestException('Verified documents cannot be deleted');

    if (document.isRequired) {
      await this.db.from('ApplicationDocument').update({ fileName: '', filePath: '', fileSize: null, mimeType: null, status: 'pending' }).eq('id', documentId);
    } else {
      await this.db.from('ApplicationDocument').delete().eq('id', documentId);
    }

    return { success: true, message: 'Document deleted successfully' };
  }

  async getAllApplications(filters?: { status?: string; stage?: string; loanType?: string; bank?: string; search?: string; fromDate?: string; toDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    let query = this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, email, firstName, lastName), documents:ApplicationDocument(id, status)', { count: 'exact' })
      .order(filters?.sortBy || 'date', { ascending: filters?.sortOrder === 'asc' });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.stage) query = query.eq('stage', filters.stage);
    if (filters?.loanType) query = query.eq('loanType', filters.loanType);
    if (filters?.bank) query = query.eq('bank', filters.bank);
    if (filters?.search) {
      query = query.or(`applicationNumber.ilike.%${filters.search}%,firstName.ilike.%${filters.search}%,lastName.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.fromDate) query = query.gte('submittedAt', filters.fromDate);
    if (filters?.toDate) query = query.lte('submittedAt', filters.toDate);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data: applications, count } = await query;
    return { success: true, data: applications || [], pagination: { total: count || 0, limit: filters?.limit || 20, offset: filters?.offset || 0 } };
  }

  async updateApplicationStatus(applicationId: string, adminId: string, adminName: string, data: { status?: string; stage?: string; progress?: number; remarks?: string; rejectionReason?: string }, role?: string) {
    const application = await this.getApplicationById(applicationId);
    const updateData: any = {};
    const historyData: any = { changedBy: adminId, changedByName: adminName };

    const isAuthorizedToChangeStatus = ['staff', 'super_admin', 'bank'].includes(role || '');

    if (data.status && data.status !== application.status) {
      if (!isAuthorizedToChangeStatus) {
        // If not authorized to change status, we only proceed if status is actually the SAME (just saving remarks)
        // In the frontend we pass selectedApp.status for admins.
      } else {
        updateData.status = data.status;
        historyData.fromStatus = application.status;
        historyData.toStatus = data.status;
        if (data.status === 'rejected' && data.rejectionReason) updateData.remarks = data.rejectionReason;
        if (data.status === 'approved') { updateData.stage = 'sanction'; updateData.progress = 90; }
        else if (data.status === 'rejected') { updateData.progress = 0; }
        else if (data.status === 'processing') { updateData.stage = 'document_verification'; updateData.progress = 40; }
      }
    }

    if (data.stage && data.stage !== application.stage) {
      if (isAuthorizedToChangeStatus) {
        updateData.stage = data.stage;
        updateData.progress = APPLICATION_STAGES[data.stage as keyof typeof APPLICATION_STAGES]?.progress || application.progress;
        historyData.fromStage = application.stage;
        historyData.toStage = data.stage;
      }
    }

    if (data.progress !== undefined && isAuthorizedToChangeStatus) updateData.progress = data.progress;
    if (data.remarks) {
        // Remarks can be updated by anyone in the StaffGuard (including admin)
        if (!updateData.remarks) updateData.remarks = data.remarks;
    }

    const { data: updated, error } = await this.db.from('LoanApplication').update(updateData).eq('id', applicationId).select().single();
    if (error) throw error;

    if (data.status || data.stage) {
      await this.createStatusHistory(applicationId, { ...historyData, notes: data.remarks });
    }

    return { success: true, data: updated, message: 'Application updated successfully' };
  }

  async verifyDocument(documentId: string, adminId: string, data: { status: 'verified' | 'rejected'; rejectionReason?: string }) {
    const { data: document } = await this.db.from('ApplicationDocument').select('id').eq('id', documentId).single();
    if (!document) throw new NotFoundException('Document not found');

    const { data: updated, error } = await this.db
      .from('ApplicationDocument')
      .update({ status: data.status, verifiedAt: data.status === 'verified' ? new Date().toISOString() : null, verifiedBy: adminId, rejectionReason: data.rejectionReason })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: updated, message: `Document ${data.status} successfully` };
  }

  async addApplicationNote(applicationId: string, authorId: string, authorName: string, data: { content: string; type?: string; isInternal?: boolean }) {
    const { data: note, error } = await this.db
      .from('ApplicationNote')
      .insert({ applicationId, authorId, authorName, content: data.content, type: data.type || 'general', isInternal: data.isInternal || false })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: note, message: 'Note added successfully' };
  }

  async getApplicationNotes(applicationId: string, includeInternal = true) {
    let query = this.db.from('ApplicationNote').select('*').eq('applicationId', applicationId).order('createdAt', { ascending: false });
    if (!includeInternal) query = query.eq('isInternal', false);
    const { data: notes } = await query;
    return { success: true, data: notes || [] };
  }

  async getApplicationStats(user?: any) {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const isBank = (user?.role === 'bank' || user?.role === 'partner_bank');
      const bankName = user?.firstName; // Following the convention used in ChatService

      let totalQuery = this.db.from('LoanApplication').select('*', { count: 'exact', head: true });
      let allAppsQuery = this.db.from('LoanApplication').select('status, loanType, amount');
      let recentAppsQuery = this.db.from('LoanApplication').select('id, applicationNumber, loanType, amount, status, date, firstName, lastName');
      let thisMonthQuery = this.db.from('LoanApplication').select('*', { count: 'exact', head: true });
      let lastMonthQuery = this.db.from('LoanApplication').select('*', { count: 'exact', head: true });

      if (isBank && bankName) {
        totalQuery = totalQuery.eq('bank', bankName);
        allAppsQuery = allAppsQuery.eq('bank', bankName);
        recentAppsQuery = recentAppsQuery.eq('bank', bankName);
        thisMonthQuery = thisMonthQuery.eq('bank', bankName);
        lastMonthQuery = lastMonthQuery.eq('bank', bankName);
      }

      console.log(`[Stats] Executing queries for ${bankName || 'all banks'}...`);
      const [
        totalRes,
        allAppsRes,
        recentAppsRes,
        thisMonthRes,
        lastMonthRes,
      ] = await Promise.all([
        Promise.resolve(totalQuery).catch(e => { console.error('Total query failed:', e); return { count: 0 } as any; }),
        Promise.resolve(allAppsQuery).catch(e => { console.error('All apps query failed:', e); return { data: [] } as any; }),
        Promise.resolve(recentAppsQuery.order('date', { ascending: false }).limit(5)).catch(e => { console.error('Recent apps query failed:', e); return { data: [] } as any; }),
        Promise.resolve(thisMonthQuery.gte('date', thisMonthStart)).catch(e => { console.error('This month query failed:', e); return { count: 0 } as any; }),
        Promise.resolve(lastMonthQuery.gte('date', lastMonthStart).lt('date', thisMonthStart)).catch(e => { console.error('Last month query failed:', e); return { count: 0 } as any; }),
      ]);

      console.log(`[Stats] Queries completed. Success: ${!!allAppsRes.data}, Count: ${allAppsRes.data?.length}`);

      const total = totalRes.count || 0;
      const allApps = allAppsRes.data || [];
      const recentApps = recentAppsRes.data || [];
      const thisMonth = thisMonthRes.count || 0;
      const lastMonth = lastMonthRes.count || 0;

      const statusStats: Record<string, number> = {};
      const loanTypeMap: Record<string, { count: number; totalAmount: number }> = {};
      const bankMap: Record<string, { approved: number; rejected: number; underView: number; total: number }> = {};
      
      let totalAmount = 0;
      let disbursedAmount = 0;
      for (const app of allApps) {
        const amt = app.amount || 0;
        totalAmount += amt;
        if (app.status === 'disbursed') {
          disbursedAmount += amt;
        }
        
        // General status stats
        statusStats[app.status] = (statusStats[app.status] || 0) + 1;
        
        // Loan type stats
        if (!loanTypeMap[app.loanType]) loanTypeMap[app.loanType] = { count: 0, totalAmount: 0 };
        loanTypeMap[app.loanType].count++;
        loanTypeMap[app.loanType].totalAmount += amt;

        // Bank stats
        const bankNameRaw = app.bank || 'Unknown Bank';
        if (!bankMap[bankNameRaw]) bankMap[bankNameRaw] = { approved: 0, rejected: 0, underView: 0, total: 0 };
        
        bankMap[bankNameRaw].total++;
        if (['approved', 'disbursed'].includes(app.status)) {
          bankMap[bankNameRaw].approved++;
        } else if (app.status === 'rejected') {
          bankMap[bankNameRaw].rejected++;
        } else if (['submitted', 'processing', 'pending', 'documents_pending', 'verification_pending'].includes(app.status) || !['cancelled', 'draft'].includes(app.status)) {
          // If it's not approved, rejected, cancelled or draft, it's under view
          bankMap[bankNameRaw].underView++;
        }
      }
      
      const loanTypeStats = Object.entries(loanTypeMap).map(([type, stats]) => ({ 
        type, 
        count: stats.count, 
        totalAmount: stats.totalAmount 
      }));

      const bankWiseStats = Object.entries(bankMap).map(([bank, stats]) => ({
        bank,
        ...stats
      })).sort((a, b) => b.total - a.total);

      const tm = thisMonth || 0;
      const lm = lastMonth || 0;

      return {
        success: true,
        data: { 
          total, 
          totalAmount,
          disbursedAmount,
          statusStats, 
          loanTypeStats, 
          bankWiseStats,
          recentApplications: recentApps, 
          monthlyComparison: { 
            thisMonth: tm, 
            lastMonth: lm, 
            change: lm > 0 ? ((tm - lm) / lm * 100).toFixed(1) : (tm > 0 ? '100.0' : '0.0') 
          } 
        },
      };
    } catch (error) {
      console.error('[ApplicationService] getApplicationStats Error:', error);
      // Return empty stats instead of throwing to prevent 500
      return {
        success: true,
        data: {
          total: 0,
          totalAmount: 0,
          disbursedAmount: 0,
          statusStats: {},
          loanTypeStats: [],
          recentApplications: [],
          monthlyComparison: { thisMonth: 0, lastMonth: 0, change: '0.0' }
        }
      };
    }
  }

  async aiReviewApplication(applicationId: string, adminId: string, adminName: string) {
    try {
      const application = await this.getApplicationById(applicationId);
      const { data: documents } = await this.db.from('ApplicationDocument').select('*').eq('applicationId', applicationId);
      const reviewResult = await this.applicationReviewService.reviewApplication(application, documents || []);

      await this.db.from('ApplicationNote').insert({ applicationId, authorId: adminId, authorName: 'AI Review System', content: JSON.stringify(reviewResult), type: 'ai_review', isInternal: true });
      await this.createStatusHistory(applicationId, { fromStatus: application.status, toStatus: application.status, changedBy: adminId, changedByName: adminName, notes: `AI Review completed. Score: ${reviewResult.overallScore}/100. Recommendation: ${reviewResult.recommendation}`, isAutomatic: true });

      return { success: true, data: reviewResult, message: 'AI review completed successfully' };
    } catch (error) {
      console.error(`[ApplicationService] aiReviewApplication failed for ${applicationId}:`, error);
      throw error;
    }
  }

  private generateApplicationNumber(loanType: string): string {
    const prefix = ({ education: 'EDU', home: 'HME', personal: 'PRS', business: 'BUS', vehicle: 'VEH' })[loanType] || 'APP';
    return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  private async createStatusHistory(applicationId: string, data: { fromStatus?: string; toStatus?: string; fromStage?: string; toStage?: string; changedBy?: string; changedByName?: string; changeReason?: string; notes?: string; isAutomatic?: boolean }) {
    await this.db.from('ApplicationStatusHistory').insert({ applicationId, ...data });
  }

  async getAgentApplications(agentId: string) {
    try {
      // 1. Get all referees referred by this agent
      const { data: referrals } = await this.db.from('Referral').select('refereeId').eq('referrerId', agentId);
      if (!referrals || referrals.length === 0) return { success: true, data: [] };

      const refereeIds = referrals.map(r => r.refereeId);

      // 2. Get applications for these students
      const { data: applications } = await this.db
        .from('LoanApplication')
        .select('*, user:User!userId(id, email, firstName, lastName)')
        .in('userId', refereeIds)
        .order('submittedAt', { ascending: false });

      return { success: true, data: applications || [] };
    } catch (error) {
      console.error('[ApplicationService] getAgentApplications Error:', error);
      return { success: false, data: [] };
    }
  }

  async getAgentStats(agentId: string) {
    try {
      // 1. Get all referees referred by this agent
      const { data: referrals } = await this.db.from('Referral').select('refereeId').eq('referrerId', agentId);
      if (!referrals || referrals.length === 0) {
        return { success: true, data: { total: 0, totalAmount: 0, revenue: 0, disbursedAmount: 0, recentApplications: [] } };
      }

      const refereeIds = referrals.map(r => r.refereeId);

      // 2. Get applications for these students
      const { data: applications } = await this.db
        .from('LoanApplication')
        .select('*')
        .in('userId', refereeIds);

      let totalAmount = 0;
      let disbursedAmount = 0;

      for (const app of applications || []) {
        const amt = parseFloat(app.amount) || 0;
        totalAmount += amt;
        if (app.status === 'disbursed' || app.status === 'approved') {
          disbursedAmount += amt;
        }
      }

      // Revenue generation logic (e.g., 0.5% commission on disbursed amount)
      const revenue = disbursedAmount * 0.005;

      return {
        success: true,
        data: {
          total: (applications || []).length,
          totalAmount,
          revenue,
          disbursedAmount,
          recentApplications: (applications || []).slice(0, 5)
        }
      };
    } catch (error) {
      console.error('[ApplicationService] getAgentStats Error:', error);
      return {
        success: true,
        data: { total: 0, totalAmount: 0, revenue: 0, disbursedAmount: 0, recentApplications: [] }
      };
    }
  }

  getRequiredDocuments(loanType: string) {
    return { success: true, data: REQUIRED_DOCUMENTS[loanType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal };
  }

  getApplicationStages() {
    return { success: true, data: APPLICATION_STAGES };
  }
}
