import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DigilockerService } from '../integration/digilocker.service';
import { DocumentVerificationService } from '../ai/services/document-verification.service';
import { ApplicationReviewService } from '../ai/services/application-review.service';
import { EmailService } from '../auth/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EvvEngineService } from './evv-engine';
import { BankWorkflowService } from '../bank/bank-workflow.service';
import { S3Service } from '../document/s3.service';
import * as path from 'path';
import * as fs from 'fs';

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
    private emailService: EmailService,
    private eventEmitter: EventEmitter2,
    private s3Service: S3Service,
    private evvEngine: EvvEngineService,
    private workflowService: BankWorkflowService,
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

  private async validateApplicationConstraints(userId: string, currentAppId: string | null, bank: string, country: string, universityName: string) {
    const { data: existingApps, error } = await this.db
      .from('LoanApplication')
      .select('id, bank, country, universityName, status')
      .eq('userId', userId)
      .neq('status', 'cancelled');

    if (error) throw error;

    // 1. Limit to 5 applications
    if (!currentAppId && existingApps && existingApps.length >= 5) {
      throw new BadRequestException('You cannot have more than 5 active/pending loan applications.');
    }

    // 2. Check duplicate details for the same bank
    if (bank && country && universityName) {
      const duplicate = existingApps?.find(app => {
        if (currentAppId && app.id === currentAppId) return false;

        const matchBank = app.bank && bank && app.bank.toLowerCase().trim() === bank.toLowerCase().trim();
        const matchCountry = app.country && country && app.country.toLowerCase().trim() === country.toLowerCase().trim();
        const matchUniversity = app.universityName && universityName && app.universityName.toLowerCase().trim() === universityName.toLowerCase().trim();

        return matchBank && matchCountry && matchUniversity;
      });

      if (duplicate) {
        throw new BadRequestException(`An active application to ${bank} for ${universityName} in ${country} already exists. To apply to the same bank, please use different details (e.g., country or university).`);
      }
    }
  }

  async createApplication(userId: string, data: any) {
    const targetBank = data.bank;
    const targetCountry = data.country;
    const targetUniversity = data.universityName || data.university;

    await this.validateApplicationConstraints(userId, null, targetBank, targetCountry, targetUniversity);

    const applicationNumber = await this.generateApplicationNumber();
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
        universityName: data.universityName || data.university,
        courseName: data.courseName || data.courseType || data.course,
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
        status: data.status === 'draft' ? 'draft' : (data.status || 'submitted'),
        stage: 'application_submitted',
        progress: data.status === 'draft' ? 10 : 15,
        submittedAt: data.status === 'draft' ? null : new Date().toISOString(),
        estimatedCompletionAt: estimatedCompletionAt.toISOString(),
      })
      .select('*, user:User!userId(id, email, firstName, lastName, tests)')
      .single();

    if (error) throw error;

    // Sync target intake and destination to User profile
    if (userId && (data.intakeSeason || data.country)) {
      try {
        await this.db
          .from('User')
          .update({
            ...(data.intakeSeason ? { intakeSeason: data.intakeSeason } : {}),
            ...(data.country ? { studyDestination: data.country } : {}),
          })
          .eq('id', userId);
      } catch (err) {
        console.error('Failed to sync target intake/destination to User profile:', err);
      }
    }

    await this.createStatusHistory(application.id, { toStatus: application.status, toStage: application.stage, notes: 'Application created', isAutomatic: true });
    await this.initializeRequiredDocuments(application.id, application.userId, data.loanType);

    // Emit application created event for staff notifications ONLY if not a draft
    if (application.status !== 'draft') {
      try {
        const name = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'Student';
        this.eventEmitter.emit('application.created', {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          userId: application.userId,
          candidateName: name,
          candidateEmail: application.email,
          bank: application.bank,
          loanAmount: application.amount,
          loanType: data.loanType,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Failed to emit application.created event:', e);
      }

      // Emit live dashboard activity event for new application creation
      try {
        const name = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'Student';
        const targetUni = application.universityName || 'Target University';
        this.eventEmitter.emit('dashboard.activity', {
          type: 'application',
          msg: `Student ${name} submitted a new Loan Application #${application.applicationNumber} for ${targetUni}.`,
          icon: 'assignment',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          actorName: name,
          actorEmail: application.email,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Failed to emit activity event for application creation:', e);
      }

      // Send loan submission email to the student
      try {
        const email = application.user?.email || application.email;
        if (email) {
          const firstName = application.firstName || application.user?.firstName || '';
          const lastName = application.lastName || application.user?.lastName || '';
          const userName = `${firstName} ${lastName}`.trim() || 'Student';
          const bankName = application.bank || 'our partner bank';
          await this.emailService.sendLoanSubmissionEmail(email, userName, bankName, application);
        }
      } catch (e) {
        console.error('Failed to send loan submission email on application creation:', e);
      }

      // Send loan tracking email to the registered student email
      try {
        const registeredEmail = application.user?.email || application.email;
        if (registeredEmail) {
          const firstName = application.user?.firstName || application.firstName || '';
          const lastName = application.user?.lastName || application.lastName || '';
          const userName = `${firstName} ${lastName}`.trim() || 'Student';
          const bankName = application.bank || 'our partner bank';
          await this.emailService.sendLoanTrackingEmail(registeredEmail, userName, bankName, application);
        }
      } catch (e) {
        console.error('Failed to send loan tracking email on application creation:', e);
      }
    }

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

    // Emit live dashboard activity event for application submission!
    try {
      const name = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'Student';
      this.eventEmitter.emit('dashboard.activity', {
        type: 'application',
        msg: `Student ${name} submitted Application #${application.applicationNumber || application.id.slice(-4)} for review.`,
        icon: 'rocket_launch',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        actorName: name,
        actorEmail: application.email,
        createdAt: new Date().toISOString()
      });
      
      // Emit application submitted event for staff notifications
      this.eventEmitter.emit('application.submitted', {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        userId: application.userId,
        candidateName: name,
        candidateEmail: application.email,
        bank: application.bank,
        loanAmount: application.amount,
        loanType: application.loanType,
        submittedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to emit events for application submission:', e);
    }

    // Send loan submission email to the student
    try {
      const email = application.user?.email || application.email;
      if (email) {
        const firstName = application.firstName || application.user?.firstName || '';
        const lastName = application.lastName || application.user?.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Student';
        const bankName = application.bank || 'our partner bank';
        await this.emailService.sendLoanSubmissionEmail(email, userName, bankName, application);
      }
    } catch (e) {
      console.error('Failed to send loan submission email on application submission:', e);
    }

    // Send loan tracking email to the registered student email
    try {
      const registeredEmail = application.user?.email || application.email;
      if (registeredEmail) {
        const firstName = application.user?.firstName || application.firstName || '';
        const lastName = application.user?.lastName || application.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Student';
        const bankName = application.bank || 'our partner bank';
        await this.emailService.sendLoanTrackingEmail(registeredEmail, userName, bankName, application);
      }
    } catch (e) {
      console.error('Failed to send loan tracking email on application submission:', e);
    }

    return { success: true, data: updated, message: 'Application submitted successfully' };
  }

  async startApplicationReview(applicationId: string) {
    const now = new Date().toISOString();
    const { data: updated, error } = await this.db
      .from('LoanApplication')
      .update({ reviewStartedAt: now })
      .eq('id', applicationId)
      .select('*, user:User!userId(id, email, firstName, lastName, tests)')
      .single();

    if (error) throw error;

    // Send the email to the student
    try {
      const email = updated.user?.email || updated.email;
      if (email) {
        const firstName = updated.firstName || updated.user?.firstName || '';
        const lastName = updated.lastName || updated.user?.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Student';
        await this.emailService.sendStaffReviewStartedEmail(email, userName, updated);
      }
    } catch (e) {
      console.error('Failed to send staff review started email:', e);
    }

    // Also add to status history
    try {
      await this.createStatusHistory(applicationId, {
        fromStatus: updated.status,
        toStatus: updated.status,
        fromStage: updated.stage,
        toStage: updated.stage,
        notes: 'VidyaLoan team started review of the application',
        isAutomatic: true
      });
    } catch (e) {
      console.error('Failed to record review start status history:', e);
    }

    return updated;
  }

  async getApplicationById(applicationId: string) {
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, email, firstName, lastName, phoneNumber, dateOfBirth, studyDestination, intakeSeason, tests), documents:ApplicationDocument(*), statusHistory:ApplicationStatusHistory(*), notes:ApplicationNote(id, content, type, isInternal, createdAt)')
      .eq('id', applicationId)
      .single();

    if (!application) throw new NotFoundException('Application not found');

    // Sort nested arrays
    if (application.documents) application.documents.sort((a: any, b: any) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
    if (application.statusHistory) application.statusHistory.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (application.notes) application.notes = application.notes.filter((n: any) => !n.isInternal).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Fetch related BankDecision and queries manually to prevent schema cache failures
    try {
      const [
        { data: bankDecisions },
        { data: queries },
        { data: bankQueries },
        { data: bankSubmissions }
      ] = await Promise.all([
        this.db.from('BankDecision').select('*').eq('applicationId', applicationId),
        this.db.from('queries').select('*').eq('applicationId', applicationId),
        this.db.from('BankQuery').select('*').eq('applicationId', applicationId),
        this.db.from('BankSubmission').select('*').eq('applicationId', applicationId)
      ]);
      application.BankDecision = bankDecisions || [];
      application.bankSubmissions = bankSubmissions || [];
      
      const allQueries = [...(queries || [])];
      if (bankQueries && bankQueries.length > 0) {
        bankQueries.forEach((bq: any) => {
          if (!allQueries.some(q => q.id === bq.id)) {
            allQueries.push({
              id: bq.id,
              authorName: bq.raisedBy || 'Banker',
              content: bq.description,
              status: bq.status?.toLowerCase() || 'open',
              createdAt: bq.raisedAt || bq.createdAt,
              resolvedAt: bq.resolvedAt,
              queryType: bq.queryType
            });
          }
        });
      }
      application.queries = allQueries;
    } catch (e) {
      console.error('Failed to load bank decisions and queries for application:', e);
      application.BankDecision = [];
      application.queries = [];
      application.bankSubmissions = [];
    }

    return application;
  }

  async getApplicationByNumber(applicationNumber: string) {
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, email, firstName, lastName, phoneNumber, dateOfBirth, studyDestination, intakeSeason, tests), documents:ApplicationDocument(*), statusHistory:ApplicationStatusHistory(*)')
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
      .order('submittedAt', { ascending: false });

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

    const targetBank = data.bank !== undefined ? data.bank : application.bank;
    const targetCountry = data.country !== undefined ? data.country : application.country;
    const targetUniversity = (data.universityName || data.university) !== undefined ? (data.universityName || data.university) : application.universityName;

    await this.validateApplicationConstraints(userId, applicationId, targetBank, targetCountry, targetUniversity);

    const updatePayload: any = {
      ...data,
      amount: data.amount ? parseFloat(data.amount) : undefined,
      tenure: data.tenure ? parseInt(data.tenure) : undefined,
      annualIncome: data.annualIncome ? parseFloat(data.annualIncome) : undefined,
      dateOfBirth: data.dateOfBirth ? this.parseDate(data.dateOfBirth) : undefined,
      courseStartDate: data.courseStartDate ? this.parseDate(data.courseStartDate) : undefined,
      universityName: data.universityName || data.university || undefined,
      courseName: data.courseName || data.courseType || data.course || undefined,
    };

    const { data: updated, error } = await this.db
      .from('LoanApplication')
      .update(updatePayload)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // Sync target intake and destination to User profile on update
    if (application.userId && (data.intakeSeason !== undefined || data.country !== undefined)) {
      try {
        await this.db
          .from('User')
          .update({
            ...(data.intakeSeason !== undefined ? { intakeSeason: data.intakeSeason } : {}),
            ...(data.country !== undefined ? { studyDestination: data.country } : {}),
          })
          .eq('id', application.userId);
      } catch (err) {
        console.error('Failed to sync target intake/destination to User profile on update:', err);
      }
    }

    return { success: true, data: updated, message: 'Application updated successfully' };
  }

  async adminUpdateApplication(applicationId: string, data: any, user?: any) {
    const application = await this.getApplicationById(applicationId);

    const targetBank = data.bank !== undefined ? data.bank : application.bank;
    const targetCountry = data.country !== undefined ? data.country : application.country;
    const targetUniversity = (data.universityName || data.university) !== undefined ? (data.universityName || data.university) : application.universityName;

    await this.validateApplicationConstraints(application.userId, applicationId, targetBank, targetCountry, targetUniversity);

    const updatePayload: any = { ...data };

    // Convert numeric fields if present
    if (data.amount !== undefined) updatePayload.amount = data.amount ? parseFloat(data.amount) : null;
    if (data.tenure !== undefined) updatePayload.tenure = data.tenure ? parseInt(data.tenure) : null;
    if (data.sanctionAmount !== undefined) updatePayload.sanctionAmount = data.sanctionAmount ? parseFloat(data.sanctionAmount) : null;
    if (data.disbursedAmount !== undefined) updatePayload.disbursedAmount = data.disbursedAmount ? parseFloat(data.disbursedAmount) : null;
    if (data.interestRate !== undefined) updatePayload.interestRate = data.interestRate ? parseFloat(data.interestRate) : null;
    if (data.sanctionedInterestRate !== undefined) updatePayload.sanctionedInterestRate = data.sanctionedInterestRate ? parseFloat(data.sanctionedInterestRate) : null;
    if (data.processingFee !== undefined) updatePayload.processingFee = data.processingFee ? parseFloat(data.processingFee) : null;
    if (data.roiBase !== undefined) updatePayload.roiBase = data.roiBase ? parseFloat(data.roiBase) : null;
    if (data.roiEffective !== undefined) updatePayload.roiEffective = data.roiEffective ? parseFloat(data.roiEffective) : null;
    if (data.roiSubsidy !== undefined) updatePayload.roiSubsidy = data.roiSubsidy ? parseFloat(data.roiSubsidy) : null;

    // Clean up undefined properties to avoid Supabase errors
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const { data: updated, error } = await this.db
      .from('LoanApplication')
      .update(updatePayload)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('[ApplicationService.adminUpdateApplication] DB Error:', error);
      throw error;
    }

    if (data.remarks !== undefined && data.remarks !== application.remarks) {
      // Find the new notes that were added by splitting by newline
      const oldRemarks = application.remarks || '';
      const newRemarks = data.remarks || '';
      
      const oldLines = oldRemarks.split('\n');
      const newLines = newRemarks.split('\n');
      const addedLines = newLines.filter(line => !oldLines.includes(line) && line.trim());

      if (addedLines.length > 0) {
        // Emit event for notification
        const addedRemarkText = addedLines.join('\n');
        this.eventEmitter.emit('bank.note.added', {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          userId: application.userId,
          candidateName: `${application.firstName || ''} ${application.lastName || ''}`.trim() || 'Candidate',
          remarks: addedRemarkText,
          updatedBy: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Bank Partner',
          userRole: user?.role || 'bank'
        });
      }
    }

    // Sync target intake and destination to User profile on admin update
    if (application.userId && (data.intakeSeason !== undefined || data.country !== undefined)) {
      try {
        await this.db
          .from('User')
          .update({
            ...(data.intakeSeason !== undefined ? { intakeSeason: data.intakeSeason } : {}),
            ...(data.country !== undefined ? { studyDestination: data.country } : {}),
          })
          .eq('id', application.userId);
      } catch (err) {
        console.error('Failed to sync target intake/destination to User profile on admin update:', err);
      }
    }

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


  private normalizeLoanType(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('education') || t.includes('study') || t.includes('undergraduate') || t.includes('postgraduate') || t.includes('doctoral')) return 'education';
    if (t.includes('home') || t.includes('property')) return 'home';
    if (t.includes('personal')) return 'personal';
    if (t.includes('business')) return 'business';
    if (t.includes('vehicle') || t.includes('car')) return 'vehicle';
    return 'personal';
  }

  private async initializeRequiredDocuments(applicationId: string, userId: string, loanType: string) {
    const normalizedType = this.normalizeLoanType(loanType);
    const requiredDocs = REQUIRED_DOCUMENTS[normalizedType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal;
    
    console.log(`[DOCS] Initializing documents for application ${applicationId}, userId ${userId}, type ${loanType} (normalized: ${normalizedType})`);
    
    // Fetch user's existing vault documents to auto-populate if possible
    const { data: vaultDocs } = await this.db.from('UserDocument').select('*').eq('userId', userId);
    
    for (const doc of requiredDocs) {
      // Find if user already has this document in their vault
      const matchingVaultDoc = vaultDocs?.find(vd => vd.docType === doc.docType && vd.uploaded);
      
      await this.db.from('ApplicationDocument').insert({ 
        applicationId, 
        docType: doc.docType, 
        docName: doc.docName, 
        fileName: matchingVaultDoc?.fileName || '', 
        filePath: matchingVaultDoc?.filePath || '', 
        status: matchingVaultDoc ? 'pending' : 'not_uploaded', 
        isRequired: doc.isRequired 
      });
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

    // Emit document uploaded event for staff notifications
    try {
      const candidateName = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'Candidate';
      this.eventEmitter.emit('document.uploaded', {
        applicationId,
        applicationNumber: application.applicationNumber,
        userId: application.userId,
        candidateName,
        candidateEmail: application.email,
        documentType: documentData.docType,
        documentName: documentData.docName,
        status: document.status,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to emit document.uploaded event:', e);
    }

    return { success: true, data: document, message: 'Document uploaded successfully' };
  }

  async getApplicationDocuments(applicationId: string, userId?: string) {
    const application = await this.getApplicationById(applicationId);
    if (userId && application.userId !== userId) {
      throw new BadRequestException('Unauthorized to view documents');
    }

    let { data: documents } = await this.db.from('ApplicationDocument').select('*').eq('applicationId', applicationId).order('isRequired', { ascending: false });

    // Lazy initialization for older applications
    if (!documents || documents.length === 0) {
      await this.initializeRequiredDocuments(application.id, application.userId, application.loanType);
      const { data: newDocs } = await this.db.from('ApplicationDocument').select('*').eq('applicationId', applicationId).order('isRequired', { ascending: false });
      documents = newDocs;
    }

    const docs = documents || [];
    
    // Also fetch the User's general Vault documents to show in a "Vault" section
    const { data: vaultDocs } = await this.db.from('UserDocument').select('*').eq('userId', application.userId);
    
    // Merge or tag vault documents that aren't already in the application
    const applicationDocTypes = new Set(docs.map(d => d.docType));
    const extraVaultDocs = (vaultDocs || [])
      .filter(vd => !applicationDocTypes.has(vd.docType) && vd.uploaded)
      .map(vd => ({
        ...vd,
        id: `vault_${vd.id}`,
        isVaultDoc: true,
        docName: (vd.docType || '').replace(/_/g, ' ').toUpperCase(),
        status: vd.status || 'uploaded'
      }));

    const allDocs = [...docs, ...extraVaultDocs];

    const grouped = {
      pending: allDocs.filter((d: any) => d.status === 'pending' && d.filePath),
      verified: allDocs.filter((d: any) => d.status === 'verified' || d.status === 'approved'),
      rejected: allDocs.filter((d: any) => d.status === 'rejected'),
      notUploaded: allDocs.filter((d: any) => !d.filePath && !d.isVaultDoc),
      vault: extraVaultDocs
    };

    return { 
      success: true, 
      data: allDocs, 
      grouped, 
      summary: { 
        total: docs.length, 
        vaultTotal: extraVaultDocs.length,
        uploaded: docs.filter((d: any) => d.filePath).length, 
        pending: grouped.pending.length, 
        verified: grouped.verified.length, 
        rejected: grouped.rejected.length, 
        notUploaded: grouped.notUploaded.length 
      } 
    };
  }

  async syncApplicationDocuments(applicationId: string, adminId?: string) {
    const application = await this.getApplicationById(applicationId);
    
    // Fetch user's existing vault documents
    const { data: vaultDocs } = await this.db.from('UserDocument').select('*').eq('userId', application.userId);
    const { data: appDocs } = await this.db.from('ApplicationDocument').select('*').eq('applicationId', applicationId);
    
    const appDocsMap = new Map(appDocs?.map(d => [d.docType, d]) || []);
    const normalizedType = this.normalizeLoanType(application.loanType);
    const requiredDocs = REQUIRED_DOCUMENTS[normalizedType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal;
    
    let syncedCount = 0;
    
    for (const req of requiredDocs) {
      const existing = appDocsMap.get(req.docType);
      const vaultMatch = vaultDocs?.find(vd => vd.docType === req.docType && vd.uploaded);
      
      if (vaultMatch) {
        if (!existing || !existing.filePath) {
          // Update or insert
          const updateData = {
            applicationId,
            docType: req.docType,
            docName: req.docName,
            fileName: vaultMatch.fileName || '',
            filePath: vaultMatch.filePath || '',
            status: 'pending',
            isRequired: req.isRequired
          };
          
          if (existing) {
            await this.db.from('ApplicationDocument').update(updateData).eq('id', existing.id);
          } else {
            await this.db.from('ApplicationDocument').insert(updateData);
          }
          syncedCount++;
        }
      } else if (!existing) {
        // Just create the requirement placeholder
        await this.db.from('ApplicationDocument').insert({
          applicationId,
          docType: req.docType,
          docName: req.docName,
          status: 'not_uploaded',
          isRequired: req.isRequired
        });
      }
    }
    
    return { success: true, message: `Synchronized ${syncedCount} documents from vault`, syncedCount };
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

  async getAllApplications(filters?: { status?: string; stage?: string; loanType?: string; bank?: string; search?: string; fromDate?: string; toDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; userId?: string; excludeStatus?: string }) {
    try {
      console.log('[ApplicationService.getAllApplications] Filters:', JSON.stringify(filters));
      
      let query = this.db
        .from('LoanApplication')
        .select('*, user:User!userId(id, email, firstName, lastName, phoneNumber, dateOfBirth, studyDestination, intakeSeason, tests), documents:ApplicationDocument(id, status), ProcessingFee(*)', { count: 'exact' });

      // Apply sorting
      const sortCol = filters?.sortBy || 'updatedAt';
      const isAsc = filters?.sortOrder === 'asc';
      query = query.order(sortCol, { ascending: isAsc });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.excludeStatus) query = query.neq('status', filters.excludeStatus);
      if (filters?.stage) query = query.eq('stage', filters.stage);
      if (filters?.loanType) query = query.eq('loanType', filters.loanType);
      if (filters?.bank) {
        query = query.ilike('bank', `%${filters.bank}%`);
        query = query.not('status', 'in', '("submitted","pending","draft","docs_received","staff_verified","application_submitted")');
      }
      
      if (filters?.search) {
        const search = filters.search;
        query = query.or(`applicationNumber.ilike.%${search}%,firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      if (filters?.fromDate) query = query.gte('submittedAt', filters.fromDate);
      if (filters?.toDate) query = query.lte('submittedAt', filters.toDate);
      
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      console.log(`[ApplicationService.getAllApplications] Executing query: sort=${sortCol}, limit=${limit}, offset=${offset}`);
      
      const { data: applications, count, error } = await query;

      if (error) {
        console.error('[ApplicationService.getAllApplications] Supabase Error:', error);
        throw error;
      }

      console.log(`[ApplicationService.getAllApplications] Success. Count: ${count}, Data size: ${applications?.length}`);
      
      return { 
        success: true, 
        data: applications || [], 
        pagination: { 
          total: count || 0, 
          limit, 
          offset 
        } 
      };
    } catch (error) {
      console.error('[ApplicationService.getAllApplications] Fatal Exception:', error);
      // Return empty instead of crashing to avoid 500
      return { 
        success: false, 
        data: [], 
        pagination: { total: 0, limit: 20, offset: 0 },
        message: 'Internal server error during application retrieval'
      };
    }
  }

  async updateApplicationStatus(applicationId: string, adminId: string, adminName: string, data: { status?: string; stage?: string; progress?: number; remarks?: string; rejectionReason?: string; bank?: string }, role?: string) {
    const application = await this.getApplicationById(applicationId);
    const updateData: any = {};
    const historyData: any = { changedBy: adminId, changedByName: adminName };

    const isAuthorizedToChangeStatus = ['staff', 'admin', 'super_admin', 'bank', 'partner_bank'].includes(role || '');

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
        else if (data.status === 'disbursed' || data.status === 'disbursement_confirmed') { updateData.stage = 'disbursement'; updateData.progress = 100; }
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
    if (data.bank && isAuthorizedToChangeStatus) updateData.bank = data.bank;
    if (data.remarks) {
        // Remarks can be updated by anyone in the StaffGuard (including admin)
        if (!updateData.remarks) updateData.remarks = data.remarks;
    }

    const { data: updated, error } = await this.db.from('LoanApplication').update(updateData).eq('id', applicationId).select().single();
    if (error) throw error;

    if (data.status || data.stage) {
      await this.createStatusHistory(applicationId, { ...historyData, notes: data.remarks });

      // Emit real-time dashboard activity event
      if (data.status && data.status !== application.status && isAuthorizedToChangeStatus) {
        const actorName = adminName || 'Staff';
        const capitalizedStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);
        
        let msg = `Staff member ${actorName} moved Application #${application.applicationNumber || application.id.slice(-4)} to ${capitalizedStatus}.`;
        let color = 'bg-blue-50 text-blue-700 border-blue-100';
        let icon = 'sync';

        if (data.status === 'approved') {
          msg = `Staff member ${actorName} moved Application #${application.applicationNumber || application.id.slice(-4)} to Approved.`;
          color = 'bg-emerald-50 text-emerald-700 border-emerald-100';
          icon = 'task_alt';
        } else if (data.status === 'rejected') {
          msg = `Staff member ${actorName} moved Application #${application.applicationNumber || application.id.slice(-4)} to Rejected.`;
          color = 'bg-rose-50 text-rose-700 border-rose-100';
          icon = 'cancel';
        }

        this.eventEmitter.emit('dashboard.activity', {
          type: data.status,
          msg,
          icon,
          color,
          actorName,
          actorEmail: adminId || null,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Send email notifications to the student on status changes
    try {
      const { data: latestApp } = await this.db
        .from('LoanApplication')
        .select('*, user:User!userId(id, email, firstName, lastName)')
        .eq('id', applicationId)
        .single();

      if (latestApp) {
        const email = latestApp.user?.email || latestApp.email;
        if (email) {
          const firstName = latestApp.firstName || latestApp.user?.firstName || '';
          const lastName = latestApp.lastName || latestApp.user?.lastName || '';
          const userName = `${firstName} ${lastName}`.trim() || 'Student';
          const bankName = latestApp.bank || 'our partner bank';

          if (data.status === 'approved' || data.status === 'sanctioned') {
            await this.emailService.sendApplicationAcceptedByBankEmail(email, userName, bankName, latestApp, data);
          } else if (data.status === 'rejected') {
            await this.emailService.sendApplicationRejectedByBankEmail(email, userName, bankName, data.rejectionReason || data.remarks || '');
          } else if (data.status === 'submitted_to_bank') {
            await this.emailService.sendApplicationSentToBankEmail(email, userName, bankName, latestApp);
          }
        }
      }
    } catch (err) {
      console.error('[ApplicationService.updateApplicationStatus] Failed to send transition email:', err);
    }

    return { success: true, data: updated, message: 'Application updated successfully' };
  }

  async verifyDocument(documentId: string, adminId: string, data: { status: 'verified' | 'rejected'; rejectionReason?: string }) {
    if (documentId.startsWith('vault_')) {
      const realId = documentId.replace('vault_', '');
      const mappedStatus = data.status === 'verified' ? 'verified' : 'rejected';
      const syncPayload: any = {
        status: mappedStatus,
        updatedAt: new Date().toISOString(),
      };

      if (mappedStatus === 'verified') {
        syncPayload.verifiedAt = new Date().toISOString();
        syncPayload.rejectionReason = null;
        syncPayload.verificationMetadata = {
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          message: 'Document manually verified by staff from application',
        };
      } else if (mappedStatus === 'rejected') {
        syncPayload.verifiedAt = null;
        syncPayload.rejectionReason = data.rejectionReason || null;
        syncPayload.verificationMetadata = {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: data.rejectionReason || null,
          message: data.rejectionReason ? `Document rejected by staff: ${data.rejectionReason}` : 'Document rejected by staff',
        };
      }

      const { data: userDoc, error } = await this.db
        .from('UserDocument')
        .update(syncPayload)
        .eq('id', realId)
        .select()
        .single();
      if (error) throw error;

      if (userDoc) {
        const docName = userDoc.verificationMetadata?.docName || userDoc.docType;
        if (mappedStatus === 'rejected') {
          this.eventEmitter.emit('document.rejected', {
            userId: userDoc.userId,
            documentId: userDoc.id,
            documentType: userDoc.docType,
            documentName: docName,
            rejectionReason: data.rejectionReason,
            rejectedAt: syncPayload.verificationMetadata.rejectedAt,
          });
        } else if (mappedStatus === 'verified') {
          this.eventEmitter.emit('document.verified', {
            userId: userDoc.userId,
            documentId: userDoc.id,
            documentType: userDoc.docType,
            documentName: docName,
            verifiedAt: syncPayload.verifiedAt,
          });
        }
      }
      return { success: true, message: `Vault document ${data.status} successfully` };
    }

    const { data: appDoc } = await this.db.from('ApplicationDocument').select('id, applicationId, docType').eq('id', documentId).single();
    if (!appDoc) {
      const { data: userDoc } = await this.db.from('UserDocument').select('*').eq('id', documentId).single();
      if (userDoc) {
        const mappedStatus = data.status === 'verified' ? 'verified' : 'rejected';
        const syncPayload: any = {
          status: mappedStatus,
          updatedAt: new Date().toISOString(),
        };

        if (mappedStatus === 'verified') {
          syncPayload.verifiedAt = new Date().toISOString();
          syncPayload.rejectionReason = null;
          syncPayload.verificationMetadata = {
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            message: 'Document manually verified by staff from application',
          };
        } else if (mappedStatus === 'rejected') {
          syncPayload.verifiedAt = null;
          syncPayload.rejectionReason = data.rejectionReason || null;
          syncPayload.verificationMetadata = {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: data.rejectionReason || null,
            message: data.rejectionReason ? `Document rejected by staff: ${data.rejectionReason}` : 'Document rejected by staff',
          };
        }

        const { data: updatedUserDoc, error } = await this.db
          .from('UserDocument')
          .update(syncPayload)
          .eq('id', documentId)
          .select()
          .single();
        if (error) throw error;

        if (updatedUserDoc) {
          const docName = updatedUserDoc.verificationMetadata?.docName || updatedUserDoc.docType;
          if (mappedStatus === 'rejected') {
            this.eventEmitter.emit('document.rejected', {
              userId: updatedUserDoc.userId,
              documentId: updatedUserDoc.id,
              documentType: updatedUserDoc.docType,
              documentName: docName,
              rejectionReason: data.rejectionReason,
              rejectedAt: syncPayload.verificationMetadata.rejectedAt,
            });
          } else if (mappedStatus === 'verified') {
            this.eventEmitter.emit('document.verified', {
              userId: updatedUserDoc.userId,
              documentId: updatedUserDoc.id,
              documentType: updatedUserDoc.docType,
              documentName: docName,
              verifiedAt: syncPayload.verifiedAt,
            });
          }
        }
        return { success: true, message: `Vault document ${data.status} successfully` };
      }
      throw new NotFoundException('Document not found');
    }

    const { data: updated, error } = await this.db
      .from('ApplicationDocument')
      .update({ status: data.status, verifiedAt: data.status === 'verified' ? new Date().toISOString() : null, verifiedBy: adminId, rejectionReason: data.rejectionReason })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    // Back-sync to UserDocument if there's a matching one
    const { data: application } = await this.db
      .from('LoanApplication')
      .select('userId')
      .eq('id', appDoc.applicationId)
      .single();

    if (application?.userId) {
      const mappedStatus = data.status === 'verified' ? 'verified' : 'rejected';
      const syncPayload: any = {
        status: mappedStatus,
        updatedAt: new Date().toISOString(),
      };

      if (mappedStatus === 'verified') {
        syncPayload.verifiedAt = new Date().toISOString();
        syncPayload.rejectionReason = null;
        syncPayload.verificationMetadata = {
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          message: 'Document manually verified by staff from application',
        };
      } else if (mappedStatus === 'rejected') {
        syncPayload.verifiedAt = null;
        syncPayload.rejectionReason = data.rejectionReason || null;
        syncPayload.verificationMetadata = {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: data.rejectionReason || null,
          message: data.rejectionReason ? `Document rejected by staff: ${data.rejectionReason}` : 'Document rejected by staff',
        };
      }

      const { data: updatedUserDoc } = await this.db
        .from('UserDocument')
        .update(syncPayload)
        .eq('userId', application.userId)
        .eq('docType', appDoc.docType)
        .select()
        .single();

      if (updatedUserDoc) {
        const docName = updatedUserDoc.verificationMetadata?.docName || updatedUserDoc.docType;
        if (mappedStatus === 'rejected') {
          this.eventEmitter.emit('document.rejected', {
            userId: updatedUserDoc.userId,
            documentId: updatedUserDoc.id,
            documentType: updatedUserDoc.docType,
            documentName: docName,
            rejectionReason: data.rejectionReason,
            rejectedAt: syncPayload.verificationMetadata.rejectedAt,
          });
        } else if (mappedStatus === 'verified') {
          this.eventEmitter.emit('document.verified', {
            userId: updatedUserDoc.userId,
            documentId: updatedUserDoc.id,
            documentType: updatedUserDoc.docType,
            documentName: docName,
            verifiedAt: syncPayload.verifiedAt,
          });
        }
      }
    }

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

  async getApplicationStats(user?: any, bankId?: string) {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const isBank = (user?.role === 'bank' || user?.role === 'partner_bank');
      let bankName: string | null = null;
      if (isBank) {
        // Try email first
        const email = user?.email;
        if (email) {
          const lowerEmail = email.toLowerCase().trim();
          if (lowerEmail.includes("auxilo") || lowerEmail === "luharika28@gmail.com") bankName = 'Auxilo';
          else if (lowerEmail.includes("avanse") || lowerEmail === "ropayi2211@aspensif.com") bankName = 'Avanse';
          else if (lowerEmail.includes("credila") || lowerEmail.includes("hdfc") || lowerEmail === "keerthichinnu0728@gmail.com") bankName = 'HDFC Credila';
          else if (lowerEmail.includes("idfc") || lowerEmail === "abhimadasu4@gmail.com") bankName = 'IDFC';
          else if (lowerEmail.includes("poonawalla") || lowerEmail === "farmatech@gmail.com") bankName = 'Poonawalla';
        }

        if (!bankName) {
          const bId = bankId || user?.firstName;
          if (bId) {
            const lower = bId.toLowerCase();
            if (lower.includes('credila')) bankName = 'HDFC Credila';
            else if (lower.includes('poonawalla')) bankName = 'Poonawalla';
            else if (lower.includes('idfc')) bankName = 'IDFC';
            else if (lower.includes('avanse')) bankName = 'Avanse';
            else if (lower.includes('auxilo')) bankName = 'Auxilo';
            else bankName = bId;
          }
        }
      }

      let totalQuery = this.db.from('LoanApplication').select('*', { count: 'exact', head: true });
      let allAppsQuery = this.db.from('LoanApplication').select('status, loanType, amount');
      let recentAppsQuery = this.db.from('LoanApplication').select('id, applicationNumber, loanType, amount, status, submittedAt, firstName, lastName');
      let thisMonthQuery = this.db.from('LoanApplication').select('*', { count: 'exact', head: true });
      let lastMonthQuery = this.db.from('LoanApplication').select('*', { count: 'exact', head: true });

      if (isBank && bankName) {
        const excludeStr = '("submitted","pending","draft","docs_received","staff_verified","application_submitted")';
        totalQuery = totalQuery.ilike('bank', `%${bankName}%`).not('status', 'in', excludeStr);
        allAppsQuery = allAppsQuery.ilike('bank', `%${bankName}%`).not('status', 'in', excludeStr);
        recentAppsQuery = recentAppsQuery.ilike('bank', `%${bankName}%`).not('status', 'in', excludeStr);
        thisMonthQuery = thisMonthQuery.ilike('bank', `%${bankName}%`).not('status', 'in', excludeStr);
        lastMonthQuery = lastMonthQuery.ilike('bank', `%${bankName}%`).not('status', 'in', excludeStr);
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
        Promise.resolve(recentAppsQuery.order('submittedAt', { ascending: false }).limit(5)).catch(e => { console.error('Recent apps query failed:', e); return { data: [] } as any; }),
        Promise.resolve(thisMonthQuery.gte('submittedAt', thisMonthStart)).catch(e => { console.error('This month query failed:', e); return { count: 0 } as any; }),
        Promise.resolve(lastMonthQuery.gte('submittedAt', lastMonthStart).lt('submittedAt', thisMonthStart)).catch(e => { console.error('Last month query failed:', e); return { count: 0 } as any; }),
      ]);

      console.log(`[Stats] Queries completed. Success: ${!!allAppsRes.data}, Count: ${allAppsRes.data?.length}`);

      const total = totalRes.count || 0;
      const allApps = allAppsRes.data || [];
      const recentApps = recentAppsRes.data || [];
      const thisMonth = thisMonthRes.count || 0;
      const lastMonth = lastMonthRes.count || 0;

      const statusStats: Record<string, number> = {};
      const loanTypeMap: Record<string, { count: number; totalAmount: number }> = {};
      
      let totalAmount = 0;
      let disbursedAmount = 0;
      for (const app of allApps) {
        const amt = app.amount || 0;
        totalAmount += amt;
        if (app.status === 'disbursed') {
          disbursedAmount += amt;
        }
        statusStats[app.status] = (statusStats[app.status] || 0) + 1;
        if (!loanTypeMap[app.loanType]) loanTypeMap[app.loanType] = { count: 0, totalAmount: 0 };
        loanTypeMap[app.loanType].count++;
        loanTypeMap[app.loanType].totalAmount += amt;
      }
      
      const loanTypeStats = Object.entries(loanTypeMap).map(([type, stats]) => ({ 
        type, 
        count: stats.count, 
        totalAmount: stats.totalAmount 
      }));

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

      // Emit real-time CIBIL verification activity
      this.eventEmitter.emit('dashboard.activity', {
        type: 'verification',
        msg: `System auto-verified CIBIL score for Student #${application.applicationNumber || application.id.slice(-4)}.`,
        icon: 'verified',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        actorName: 'System',
        actorEmail: 'system@vidyaloan.in',
        createdAt: new Date().toISOString()
      });

      return { success: true, data: reviewResult, message: 'AI review completed successfully' };
    } catch (error) {
      console.error(`[ApplicationService] aiReviewApplication failed for ${applicationId}:`, error);
      throw error;
    }
  }

  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VL-APP-${year}-`;
    
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('applicationNumber')
        .like('applicationNumber', `${prefix}%`)
        .order('applicationNumber', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[ApplicationService] Error fetching max application number:', error);
      }

      let nextSeq = 1;
      if (data && data.applicationNumber) {
        const parts = data.applicationNumber.split('-');
        if (parts.length === 4) {
          const currentSeq = parseInt(parts[3], 10);
          if (!isNaN(currentSeq)) {
            nextSeq = currentSeq + 1;
          }
        }
      }
      return `${prefix}${String(nextSeq).padStart(5, '0')}`;
    } catch (err) {
      console.error('[ApplicationService] Failed to generate sequential application number, falling back to random:', err);
      const seq = String(Math.floor(Math.random() * 100_000)).padStart(5, '0');
      return `${prefix}${seq}`;
    }
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
        .select('*, user:User!userId(id, email, firstName, lastName, tests)')
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

  async shareApplication(applicationId: string, adminId: string, adminName: string) {
    try {
      const application = await this.getApplicationById(applicationId);
      if (!application) throw new Error('Application not found');

      const userEmail = application.email || (application.user as any)?.email;
      if (!userEmail) throw new Error('Recipient email not found');

      const frontendUrl = process.env.FRONTEND_URL || 'https://developer.vidyaloans.in';
      const statusColor = application.status === 'approved' ? '#10b981' : application.status === 'rejected' ? '#ef4444' : '#6366f1';

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); padding: 40px; border-radius: 24px 24px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Vidyaloan</h1>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px;">Application Details Shared</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 24px 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e1b4b; font-size: 20px; margin-bottom: 24px;">Hi ${application.firstName || 'Student'},</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
              Details for your education loan application <strong>${application.applicationNumber}</strong> are summarized below. You can track your progress anytime on our dashboard.
            </p>

            <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Status</td>
                  <td style="padding-bottom: 12px; text-align: right;">
                    <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                      ${application.status?.toUpperCase() || 'IN REVIEW'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Current Stage</td>
                  <td style="padding-bottom: 12px; text-align: right; font-weight: 700; color: #1e1b4b;">${application.stage?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Loan Amount</td>
                  <td style="padding-bottom: 12px; text-align: right; font-weight: 700; color: #1e1b4b;">₹${Number(application.amount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Bank Partner</td>
                  <td style="padding-bottom: 12px; text-align: right; font-weight: 700; color: #1e1b4b;">${application.bank || 'Pending Assignment'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Progress</td>
                  <td style="text-align: right; font-weight: 700; color: #1e1b4b;">${application.progress}%</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${frontendUrl}/dashboard" style="display: inline-block; background-color: #4338ca; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.4);">
                Track My Application
              </a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
              <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                This information was shared by ${adminName} from the Vidyaloan Staff Dashboard.<br>
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
          
          <div style="padding: 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Vidyaloan. All rights reserved.
          </div>
        </div>
      `;

      await this.emailService.sendMail(
        userEmail,
        `Application Details: ${application.applicationNumber} - Vidyaloan`,
        emailHtml
      );

      // Log the share action as a note
      await this.db.from('ApplicationNote').insert({ applicationId, authorId: adminId, authorName: adminName, content: `Application details shared to registered email: ${userEmail}`, type: 'share', isInternal: true });

      return { success: true, message: 'Application details shared successfully' };
    } catch (error) {
      console.error('[ApplicationService] shareApplication Error:', error);
      throw new Error(`Failed to share application: ${error.message}`);
    }
  }

  getRequiredDocuments(loanType: string) {
    return { success: true, data: REQUIRED_DOCUMENTS[loanType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal };
  }

  getApplicationStages() {
    return { success: true, data: APPLICATION_STAGES };
  }

  async getDisbursements(applicationId: string) {
    const { data, error } = await this.db
      .from('disbursements')
      .select('*')
      .eq('applicationId', applicationId)
      .order('disbursedAt', { ascending: false });
    return { data: data || [], error };
  }

  async processBankStatementEvv(
    applicationId: string,
    file: Express.Multer.File,
    adminId: string,
    adminName: string
  ) {
    console.log(`[EVV Pipeline] Processing statement for application ${applicationId} by admin ${adminName}`);

    // 1. Fetch application details
    const application = await this.getApplicationById(applicationId);
    if (!application) throw new NotFoundException('Application not found');
    const userId = application.userId;

    // 2. Upload statement to S3 (or local fallback)
    const fileExt = path.extname(file.originalname);
    const s3Key = `vault/${userId}/bank_statement${fileExt}`;
    
    try {
      await this.s3Service.upload(s3Key, file.buffer, file.mimetype);
      console.log(`[EVV Pipeline] Uploaded statement to S3: ${s3Key}`);
    } catch (s3Error: any) {
      console.warn(`[EVV Pipeline] AWS S3 Upload failed, saving local: ${s3Error.message}`);
      try {
        const localDir = path.join(process.cwd(), 'uploads', userId, 'bank_statement');
        await fs.promises.mkdir(localDir, { recursive: true });
        await fs.promises.writeFile(path.join(localDir, `file${fileExt}`), file.buffer);
      } catch (localWriteError: any) {
        console.error('[EVV Pipeline] Local fallback failed:', localWriteError.message);
      }
    }

    // 3. Upsert document record in ApplicationDocument
    const docData = {
      applicationId,
      docType: 'bank_statement',
      docName: 'Bank Statements (6 months)',
      fileName: file.originalname,
      filePath: s3Key,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'uploaded',
      uploadedAt: new Date().toISOString()
    };

    const { data: existingDoc } = await this.db
      .from('ApplicationDocument')
      .select('id')
      .eq('applicationId', applicationId)
      .eq('docType', 'bank_statement')
      .maybeSingle();

    if (existingDoc) {
      const { error } = await this.db
        .from('ApplicationDocument')
        .update({ ...docData, status: 'uploaded' })
        .eq('id', existingDoc.id);
      if (error) throw new BadRequestException(`Failed to update statement document: ${error.message}`);
    } else {
      const { error } = await this.db
        .from('ApplicationDocument')
        .insert({
          id: 'app-doc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          ...docData,
          isRequired: true
        });
      if (error) throw new BadRequestException(`Failed to insert statement document: ${error.message}`);
    }

    // 4. Mark application as PROCESSING so frontend can poll
    await this.db
      .from('LoanApplication')
      .update({ evvStatus: 'PROCESSING', evvOverall: null, evvMonthlyBreakdown: [] })
      .eq('id', applicationId);

    // 5. Run EVV computation in the background (fire-and-forget) — do not await
    //    This prevents HTTP request timeouts for large bank statement PDFs
    this.computeEvvInBackground(applicationId, file, adminId, adminName, application, s3Key).catch(err => {
      console.error(`[EVV Pipeline] Background computation error: ${err.message}`);
    });

    // 6. Respond immediately so the HTTP request does not time out
    return {
      success: true,
      status: 'PROCESSING',
      message: 'Bank statement uploaded. EVV calculation is running in the background. Please refresh in a minute.',
    };
  }

  private async computeEvvInBackground(
    applicationId: string,
    file: Express.Multer.File,
    adminId: string,
    adminName: string,
    application: any,
    s3Key: string
  ) {
    let evvOverall = 0;
    let evvMonthlyBreakdown: any = [];
    let evvStatus: 'COMPUTED' | 'FAILED' | 'MANUAL_REVIEW' = 'COMPUTED';
    let errorMessage = '';

    try {
      console.log(`[EVV Background] Starting AI extraction for application ${applicationId}`);
      const transactions = await this.evvEngine.extractTransactions(file.buffer, file.mimetype, file.originalname);
      
      if (!transactions || transactions.length === 0) {
        console.warn(`[EVV Background] Parser failed to extract transactions for application ${applicationId}`);
        evvStatus = 'MANUAL_REVIEW';
        errorMessage = 'Unable to extract transaction text patterns from this statement format.';
      } else {
        const evvResults = this.evvEngine.computeEvv(transactions);
        evvOverall = evvResults.overall_evv;
        evvMonthlyBreakdown = evvResults.monthly_evv;
        evvStatus = evvResults.status;
        console.log(`[EVV Background] Computed EVV for ${applicationId}: ₹${evvOverall} (${evvStatus})`);

        // Dynamically update document requirement name to match actual statement months count
        const numMonths = evvMonthlyBreakdown.length;
        const dynamicDocName = `Bank Statements (${numMonths} months)`;
        const { error: docUpdateError } = await this.db
          .from('ApplicationDocument')
          .update({ docName: dynamicDocName })
          .eq('applicationId', applicationId)
          .eq('docType', 'bank_statement');
        if (docUpdateError) {
          console.error(`[EVV Background] Failed to update docName in DB: ${docUpdateError.message}`);
        } else {
          console.log(`[EVV Background] Dynamically updated docName in DB to: ${dynamicDocName}`);
        }
      }
    } catch (err: any) {
      console.error(`[EVV Background] Calculation exception: ${err.message}`);
      evvStatus = 'MANUAL_REVIEW';
      errorMessage = err.message?.includes('timeout') || err.message?.includes('aborted')
        ? 'AI processing timed out — the bank statement may be too large or complex. Please try a smaller/clearer PDF.'
        : err.message || 'Error occurred during AI statement scanning.';
    }

    // Update database with results
    const updateData: any = {
      evvOverall,
      evvMonthlyBreakdown,
      evvStatus
    };

    if (evvStatus === 'MANUAL_REVIEW' || evvStatus === 'FAILED') {
      updateData.remarks = `EVV Calculation: Manual Review Required — ${errorMessage}`;
    }

    const { error: updateError } = await this.db
      .from('LoanApplication')
      .update(updateData)
      .eq('id', applicationId);

    if (updateError) {
      console.error(`[EVV Background] Failed to update LoanApplication with EVV: ${updateError.message}`);
    }

    // Log notes & status history
    const auditNotes = evvStatus === 'COMPUTED'
      ? `EVV Calculation completed. Overall balance: ₹${evvOverall.toLocaleString('en-IN')}. Monthly breakdowns saved.`
      : `EVV Calculation: Manual Review Required — ${errorMessage}`;

    await this.db.from('ApplicationNote').insert({
      id: 'note-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      applicationId,
      authorId: adminId,
      authorName: 'EVV Engine',
      content: auditNotes,
      type: 'general',
      isInternal: true
    });

    await this.createStatusHistory(applicationId, {
      fromStatus: application.status,
      toStatus: application.status,
      changedBy: adminId,
      changedByName: adminName,
      notes: auditNotes,
      isAutomatic: true
    });

    // Auto-sharing routing rules
    let autoShared = false;
    if (evvStatus === 'COMPUTED' && evvOverall > 5000) {
      try {
        console.log(`[EVV Background] Auto-sharing application ${applicationId} to partner banks (EVV = ₹${evvOverall})`);
        await this.workflowService.submitApplicationToBank(
          applicationId,
          application.bank ? application.bank.toLowerCase().replace(/\s+/g, '') : 'auxilo',
          application.bank || 'Auxilo Finserve',
          'System Automation'
        );
        autoShared = true;
        await this.db
          .from('LoanApplication')
          .update({ evvStatus: 'ROUTED_TO_BANK' })
          .eq('id', applicationId);
      } catch (shareError: any) {
        console.error(`[EVV Background] Auto-share failed: ${shareError.message}`);
      }
    }

    // Emit real-time dashboard activity
    this.eventEmitter.emit('dashboard.activity', {
      type: 'verification',
      msg: `EVV analyzed for Student #${application.applicationNumber || application.id.slice(-4)}. Overall: ₹${evvOverall.toLocaleString('en-IN')}. Status: ${evvStatus}.`,
      icon: evvStatus === 'COMPUTED' ? 'payments' : 'warning',
      color: evvStatus === 'COMPUTED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100',
      actorName: 'EVV Engine',
      actorEmail: 'evv@vidyaloan.in',
      createdAt: new Date().toISOString()
    });

    console.log(`[EVV Background] Completed for application ${applicationId}: status=${evvStatus}, overall=₹${evvOverall}`);
  }
}
