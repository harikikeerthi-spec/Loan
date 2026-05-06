import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Application stages with descriptions and order
const APPLICATION_STAGES = {
    application_submitted: { order: 1, label: 'Application Submitted', progress: 10 },
    document_verification: { order: 2, label: 'Document Verification', progress: 30 },
    credit_check: { order: 3, label: 'Credit Check', progress: 50 },
    bank_review: { order: 4, label: 'Bank Review', progress: 70 },
    sanction: { order: 5, label: 'Sanction', progress: 90 },
    disbursement: { order: 6, label: 'Disbursement', progress: 100 },
};

// Required documents by loan type
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
    constructor(private prisma: PrismaService) { }

    // ==================== APPLICATION CRUD ====================

    /**
     * Create a new loan application
     */
    async createApplication(userId: string, data: any) {
        try {
            console.log('[ApplicationService] Creating application for user:', userId);

            // Validation logic
            if (!data.firstName || data.firstName.length < 3) {
                throw new BadRequestException('First name must be at least 3 characters long');
            }
            if (!data.lastName || data.lastName.length < 1) {
                throw new BadRequestException('Last name must be at least 1 character long');
            }
            const phoneDigits = data.phone?.replace(/[^0-9]/g, '') || '';
            if (phoneDigits.length !== 10) {
                throw new BadRequestException('Phone number must be exactly 10 digits');
            }

            // Parent Details Validation (if provided)
            if (data.fatherName && data.fatherName.length < 3) {
                throw new BadRequestException('Father\'s name must be at least 3 characters long');
            }
            if (data.fatherPhone) {
                const fPhoneDigits = data.fatherPhone.replace(/[^0-9]/g, '');
                if (fPhoneDigits.length !== 10) {
                    throw new BadRequestException('Father\'s phone number must be exactly 10 digits');
                }
            }
            if (data.motherName && data.motherName.length < 3) {
                throw new BadRequestException('Mother\'s name must be at least 3 characters long');
            }
            if (data.motherPhone) {
                const mPhoneDigits = data.motherPhone.replace(/[^0-9]/g, '');
                if (mPhoneDigits.length !== 10) {
                    throw new BadRequestException('Mother\'s phone number must be exactly 10 digits');
                }
            }

            // Generate application number
            const applicationNumber = this.generateApplicationNumber(data.loanType);

            // Calculate estimated completion date (14 days from now)
            const estimatedCompletionAt = new Date();
            estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);

            const application = await this.prisma.loanApplication.create({
                data: {
                    applicationNumber,
                    userId,
                    bank: data.bank || 'HDFC Credila',
                    loanType: data.loanType || 'education',
                    amount: data.amount ? parseFloat(data.amount.toString()) : 0,
                    tenure: data.tenure ? parseInt(data.tenure.toString()) : null,
                    purpose: data.purpose,
                    // Applicant Details
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender,
                    nationality: data.nationality,
                    // Address
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    country: data.country,
                    // Employment
                    employmentType: data.employmentType,
                    employerName: data.employerName,
                    jobTitle: data.jobTitle,
                    annualIncome: data.annualIncome ? parseFloat(data.annualIncome.toString()) : null,
                    workExperience: data.workExperience ? parseInt(data.workExperience.toString()) : null,
                    // Education specific
                    universityName: data.universityName,
                    courseName: data.courseName,
                    courseDuration: data.courseDuration ? parseInt(data.courseDuration.toString()) : null,
                    courseStartDate: data.courseStartDate ? new Date(data.courseStartDate) : null,
                    admissionStatus: data.admissionStatus,
                    // Co-Applicant
                    hasCoApplicant: data.hasCoApplicant || false,
                    coApplicantName: data.coApplicantName,
                    coApplicantRelation: data.coApplicantRelation,
                    coApplicantPhone: data.coApplicantPhone,
                    coApplicantEmail: data.coApplicantEmail,
                    coApplicantIncome: data.coApplicantIncome ? parseFloat(data.coApplicantIncome.toString()) : null,
                    // Parent Details
                    fatherName: data.fatherName,
                    fatherPhone: data.fatherPhone,
                    fatherEmail: data.fatherEmail,
                    motherName: data.motherName,
                    motherPhone: data.motherPhone,
                    motherEmail: data.motherEmail,
                    // Collateral
                    hasCollateral: data.hasCollateral || false,
                    collateralType: data.collateralType,
                    collateralValue: data.collateralValue ? parseFloat(data.collateralValue.toString()) : null,
                    collateralDetails: data.collateralDetails,
                    // Status
                    status: data.status || 'draft',
                    stage: 'application_submitted',
                    progress: 10,
                    estimatedCompletionAt,
                },
                include: {
                    user: {
                        select: { id: true, email: true, firstName: true, lastName: true }
                    }
                }
            });

            // Create initial status history
            await this.createStatusHistory(application.id, {
                toStatus: application.status,
                toStage: application.stage,
                notes: 'Application created',
                isAutomatic: true,
            });

            // Initialize required documents based on loan type
            await this.initializeRequiredDocuments(application.id, data.loanType || 'education');

            return {
                success: true,
                data: application,
                message: 'Application created successfully'
            };
        } catch (error) {
            console.error('[ApplicationService] Error in createApplication:', error);
            throw error;
        }
    }

    /**
     * Submit a draft application
     */
    async submitApplication(applicationId: string, userId: string) {
        const application = await this.getApplicationById(applicationId);

        if (application.userId !== userId) {
            throw new BadRequestException('Unauthorized to submit this application');
        }

        if (application.status !== 'draft') {
            throw new BadRequestException('Only draft applications can be submitted');
        }

        const updated = await this.prisma.loanApplication.update({
            where: { id: applicationId },
            data: {
                status: 'submitted',
                submittedAt: new Date(),
                progress: 15,
            },
            include: {
                documents: true,
                statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
        });

        await this.createStatusHistory(applicationId, {
            fromStatus: 'draft',
            toStatus: 'submitted',
            notes: 'Application submitted for review',
            isAutomatic: true,
        });

        return {
            success: true,
            data: updated,
            message: 'Application submitted successfully'
        };
    }

    /**
     * Get application by ID
     */
    async getApplicationById(applicationId: string) {
        const application = await this.prisma.loanApplication.findUnique({
            where: { id: applicationId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true }
                },
                documents: {
                    orderBy: { uploadedAt: 'desc' }
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' }
                },
                notes: {
                    where: { isInternal: false },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return application;
    }

    /**
     * Get application by application number
     */
    async getApplicationByNumber(applicationNumber: string) {
        const application = await this.prisma.loanApplication.findUnique({
            where: { applicationNumber },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true }
                },
                documents: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return application;
    }

    /**
     * Get all applications for a user
     */
    async getUserApplications(userId: string, filters?: {
        status?: string;
        loanType?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = { userId };

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.loanType) {
            where.loanType = filters.loanType;
        }

        const [applications, total] = await Promise.all([
            this.prisma.loanApplication.findMany({
                where,
                include: {
                    documents: true
                },
                orderBy: { date: 'desc' },
                take: filters?.limit || 20,
                skip: filters?.offset || 0,
            }),
            this.prisma.loanApplication.count({ where })
        ]);

        return {
            success: true,
            data: applications,
            pagination: {
                total,
                limit: filters?.limit || 20,
                offset: filters?.offset || 0
            }
        };
    }

    /**
     * Update application
     */
    async updateApplication(applicationId: string, userId: string, data: any) {
        const application = await this.getApplicationById(applicationId);

        if (application.userId !== userId) {
            throw new BadRequestException('Unauthorized to update this application');
        }

        if (!['draft', 'documents_pending'].includes(application.status)) {
            throw new BadRequestException('Application cannot be modified in current status');
        }

        const updated = await this.prisma.loanApplication.update({
            where: { id: applicationId },
            data: {
                ...data,
                amount: data.amount ? parseFloat(data.amount) : undefined,
                tenure: data.tenure ? parseInt(data.tenure) : undefined,
                annualIncome: data.annualIncome ? parseFloat(data.annualIncome) : undefined,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                courseStartDate: data.courseStartDate ? new Date(data.courseStartDate) : undefined,
            },
            include: {
                documents: true
            }
        });

        return {
            success: true,
            data: updated,
            message: 'Application updated successfully'
        };
    }

    /**
     * Cancel application
     */
    async cancelApplication(applicationId: string, userId: string, reason?: string) {
        const application = await this.getApplicationById(applicationId);

        if (application.userId !== userId) {
            throw new BadRequestException('Unauthorized to cancel this application');
        }

        if (['approved', 'disbursed', 'cancelled'].includes(application.status)) {
            throw new BadRequestException('Application cannot be cancelled in current status');
        }

        const updated = await this.prisma.loanApplication.update({
            where: { id: applicationId },
            data: {
                status: 'cancelled',
                remarks: reason,
            }
        });

        await this.createStatusHistory(applicationId, {
            fromStatus: application.status,
            toStatus: 'cancelled',
            notes: reason || 'Application cancelled by user',
            isAutomatic: false,
        });

        return {
            success: true,
            data: updated,
            message: 'Application cancelled successfully'
        };
    }

    /**
     * Delete application
     */
    async deleteApplication(applicationId: string, userId: string) {
        const application = await this.getApplicationById(applicationId);

        if (application.userId !== userId) {
            throw new BadRequestException('Unauthorized to delete this application');
        }

        // Optional: restriction on status, e.g. can only delete if draft/cancelled/rejected
        // For now allowing deletion regardless of status as per request, but good to be mindful.

        // Delete related records
        // Prisma cascade delete might handle this if configured, but explicit deletion is safer if relationships vary

        // 1. Delete documents
        await this.prisma.applicationDocument.deleteMany({
            where: { applicationId }
        });

        // 2. Delete notes
        await this.prisma.applicationNote.deleteMany({
            where: { applicationId }
        });

        // 3. Delete status history
        await this.prisma.applicationStatusHistory.deleteMany({
            where: { applicationId }
        });

        // 4. Delete application
        await this.prisma.loanApplication.delete({
            where: { id: applicationId }
        });

        return {
            success: true,
            message: 'Application deleted successfully'
        };
    }

    // ==================== APPLICATION TRACKING ====================

    /**
     * Get application timeline/tracking info
     */
    async getApplicationTracking(applicationId: string, userId?: string) {
        const application = await this.prisma.loanApplication.findUnique({
            where: { id: applicationId },
            include: {
                statusHistory: {
                    orderBy: { createdAt: 'asc' }
                },
                documents: true
            }
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // If userId provided, verify ownership
        if (userId && application.userId !== userId) {
            throw new BadRequestException('Unauthorized to view this application');
        }

        // Build stages with completion status
        const stages = Object.entries(APPLICATION_STAGES).map(([key, value]) => {
            const currentStageOrder = APPLICATION_STAGES[application.stage as keyof typeof APPLICATION_STAGES]?.order || 0;
            const isCompleted = value.order < currentStageOrder;
            const isCurrent = key === application.stage;

            return {
                key,
                label: value.label,
                order: value.order,
                isCompleted,
                isCurrent,
                completedAt: isCompleted
                    ? application.statusHistory.find(h => h.toStage === key)?.createdAt
                    : null
            };
        });

        // Calculate documents status
        const documentsStatus = {
            total: application.documents.length,
            pending: application.documents.filter(d => d.status === 'pending').length,
            verified: application.documents.filter(d => d.status === 'verified').length,
            rejected: application.documents.filter(d => d.status === 'rejected').length,
        };

        return {
            success: true,
            data: {
                applicationId: application.id,
                applicationNumber: application.applicationNumber,
                status: application.status,
                currentStage: application.stage,
                progress: application.progress,
                stages,
                timeline: application.statusHistory,
                documents: documentsStatus,
                estimatedCompletion: application.estimatedCompletionAt,
                submittedAt: application.submittedAt,
                lastUpdated: application.updatedAt,
            }
        };
    }

    /**
     * Track application by application number (public)
     */
    async trackApplication(applicationNumber: string) {
        const application = await this.prisma.loanApplication.findUnique({
            where: { applicationNumber },
            select: {
                id: true,
                applicationNumber: true,
                loanType: true,
                bank: true,
                amount: true,
                status: true,
                stage: true,
                progress: true,
                submittedAt: true,
                estimatedCompletionAt: true,
                updatedAt: true,
            }
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const stages = Object.entries(APPLICATION_STAGES).map(([key, value]) => {
            const currentStageOrder = APPLICATION_STAGES[application.stage as keyof typeof APPLICATION_STAGES]?.order || 0;
            return {
                key,
                label: value.label,
                order: value.order,
                isCompleted: value.order < currentStageOrder,
                isCurrent: key === application.stage,
            };
        });

        return {
            success: true,
            data: {
                ...application,
                stages,
            }
        };
    }

    // ==================== DOCUMENT MANAGEMENT ====================

    /**
     * Initialize required documents for an application
     */
    private async initializeRequiredDocuments(applicationId: string, loanType: string) {
        const requiredDocs = REQUIRED_DOCUMENTS[loanType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal;

        // We'll create placeholder records for required documents
        // These will be updated when user uploads actual files
        for (const doc of requiredDocs) {
            await this.prisma.applicationDocument.create({
                data: {
                    applicationId,
                    docType: doc.docType,
                    docName: doc.docName,
                    fileName: '',
                    filePath: '',
                    status: 'pending',
                    isRequired: doc.isRequired,
                }
            });
        }
    }

    /**
     * Upload document to application
     */
    async uploadDocument(applicationId: string, userId: string, documentData: {
        docType: string;
        docName: string;
        fileName: string;
        filePath: string;
        fileSize?: number;
        mimeType?: string;
    }) {
        const application = await this.getApplicationById(applicationId);

        if (application.userId !== userId) {
            throw new BadRequestException('Unauthorized to upload documents');
        }

        // Check if document exists (was pre-initialized)
        const existingDoc = await this.prisma.applicationDocument.findFirst({
            where: {
                applicationId,
                docType: documentData.docType
            }
        });

        let document;
        if (existingDoc) {
            // Update existing document
            document = await this.prisma.applicationDocument.update({
                where: { id: existingDoc.id },
                data: {
                    fileName: documentData.fileName,
                    filePath: documentData.filePath,
                    fileSize: documentData.fileSize,
                    mimeType: documentData.mimeType,
                    status: 'pending',
                    uploadedAt: new Date(),
                }
            });
        } else {
            // Create new document
            document = await this.prisma.applicationDocument.create({
                data: {
                    applicationId,
                    ...documentData,
                    status: 'pending',
                }
            });
        }

        return {
            success: true,
            data: document,
            message: 'Document uploaded successfully'
        };
    }

    /**
     * Get documents for an application
     */
    async getApplicationDocuments(applicationId: string, userId?: string) {
        if (userId) {
            const application = await this.getApplicationById(applicationId);
            if (application.userId !== userId) {
                throw new BadRequestException('Unauthorized to view documents');
            }
        }

        const documents = await this.prisma.applicationDocument.findMany({
            where: { applicationId },
            orderBy: { uploadedAt: 'desc' }
        });

        // Group by status
        const grouped = {
            pending: documents.filter(d => d.status === 'pending' && d.filePath),
            verified: documents.filter(d => d.status === 'verified'),
            rejected: documents.filter(d => d.status === 'rejected'),
            notUploaded: documents.filter(d => !d.filePath),
        };

        return {
            success: true,
            data: documents,
            grouped,
            summary: {
                total: documents.length,
                uploaded: documents.filter(d => d.filePath).length,
                pending: grouped.pending.length,
                verified: grouped.verified.length,
                rejected: grouped.rejected.length,
                notUploaded: grouped.notUploaded.length,
            }
        };
    }

    /**
     * Delete a document
     */
    async deleteDocument(documentId: string, userId: string) {
        const document = await this.prisma.applicationDocument.findUnique({
            where: { id: documentId },
            include: { application: true }
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        if (document.application.userId !== userId) {
            throw new BadRequestException('Unauthorized to delete this document');
        }

        if (document.status === 'verified') {
            throw new BadRequestException('Verified documents cannot be deleted');
        }

        // Reset the document instead of deleting if it's a required doc
        if (document.isRequired) {
            await this.prisma.applicationDocument.update({
                where: { id: documentId },
                data: {
                    fileName: '',
                    filePath: '',
                    fileSize: null,
                    mimeType: null,
                    status: 'pending',
                }
            });
        } else {
            await this.prisma.applicationDocument.delete({
                where: { id: documentId }
            });
        }

        return {
            success: true,
            message: 'Document deleted successfully'
        };
    }

    // ==================== ADMIN OPERATIONS ====================

    /**
     * Get all applications (admin)
     */
    async getAllApplications(filters?: {
        status?: string;
        stage?: string;
        loanType?: string;
        bank?: string;
        search?: string;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.stage) where.stage = filters.stage;
        if (filters?.loanType) where.loanType = filters.loanType;
        if (filters?.bank) where.bank = filters.bank;

        if (filters?.search) {
            where.OR = [
                { applicationNumber: { contains: filters.search, mode: 'insensitive' } },
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters?.fromDate || filters?.toDate) {
            where.submittedAt = {};
            if (filters.fromDate) where.submittedAt.gte = new Date(filters.fromDate);
            if (filters.toDate) where.submittedAt.lte = new Date(filters.toDate);
        }

        const orderBy: any = {};
        orderBy[filters?.sortBy || 'date'] = filters?.sortOrder || 'desc';

        const [applications, total] = await Promise.all([
            this.prisma.loanApplication.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, email: true, firstName: true, lastName: true }
                    },
                    documents: true
                },
                orderBy,
                take: filters?.limit || 20,
                skip: filters?.offset || 0,
            }),
            this.prisma.loanApplication.count({ where })
        ]);

        return {
            success: true,
            data: applications,
            pagination: {
                total,
                limit: filters?.limit || 20,
                offset: filters?.offset || 0
            }
        };
    }

    /**
     * Update application status (admin)
     */
    async updateApplicationStatus(
        applicationId: string,
        adminId: string,
        adminName: string,
        data: {
            status?: string;
            stage?: string;
            progress?: number;
            remarks?: string;
            assignedTo?: string;
            sanctionAmount?: number;
            sanctionedInterestRate?: number;
            rejectionReason?: string;
        }
    ) {
        const application = await this.getApplicationById(applicationId);

        const updateData: any = {};
        const historyData: any = {
            changedBy: adminId,
            changedByName: adminName,
        };

        if (data.status && data.status !== application.status) {
            updateData.status = data.status;
            historyData.fromStatus = application.status;
            historyData.toStatus = data.status;

            // Set timestamps based on status
            if (data.status === 'under_review') {
                updateData.reviewStartedAt = new Date();
            } else if (data.status === 'approved') {
                updateData.approvedAt = new Date();
            } else if (data.status === 'rejected') {
                updateData.rejectedAt = new Date();
                updateData.rejectionReason = data.rejectionReason;
            } else if (data.status === 'disbursed') {
                updateData.disbursedAt = new Date();
            }
        }

        if (data.stage && data.stage !== application.stage) {
            updateData.stage = data.stage;
            updateData.progress = APPLICATION_STAGES[data.stage as keyof typeof APPLICATION_STAGES]?.progress || application.progress;
            historyData.fromStage = application.stage;
            historyData.toStage = data.stage;
        }

        if (data.progress !== undefined) updateData.progress = data.progress;
        if (data.remarks) updateData.remarks = data.remarks;
        if (data.assignedTo) updateData.assignedTo = data.assignedTo;
        if (data.sanctionAmount) updateData.sanctionAmount = data.sanctionAmount;
        if (data.sanctionedInterestRate) updateData.sanctionedInterestRate = data.sanctionedInterestRate;

        const updated = await this.prisma.loanApplication.update({
            where: { id: applicationId },
            data: updateData,
            include: {
                documents: true,
                statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
        });

        // Create status history entry
        if (data.status || data.stage) {
            await this.createStatusHistory(applicationId, {
                ...historyData,
                notes: data.remarks,
            });
        }

        return {
            success: true,
            data: updated,
            message: 'Application updated successfully'
        };
    }

    /**
     * Verify document (admin)
     */
    async verifyDocument(
        documentId: string,
        adminId: string,
        data: {
            status: 'verified' | 'rejected';
            rejectionReason?: string;
        }
    ) {
        const document = await this.prisma.applicationDocument.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        const updated = await this.prisma.applicationDocument.update({
            where: { id: documentId },
            data: {
                status: data.status,
                verifiedAt: data.status === 'verified' ? new Date() : null,
                verifiedBy: adminId,
                rejectionReason: data.rejectionReason,
            }
        });

        return {
            success: true,
            data: updated,
            message: `Document ${data.status} successfully`
        };
    }

    /**
     * Add note to application (admin)
     */
    async addApplicationNote(
        applicationId: string,
        authorId: string,
        authorName: string,
        data: {
            content: string;
            type?: string;
            isInternal?: boolean;
        }
    ) {
        const note = await this.prisma.applicationNote.create({
            data: {
                applicationId,
                authorId,
                authorName,
                content: data.content,
                type: data.type || 'general',
                isInternal: data.isInternal || false,
            }
        });

        return {
            success: true,
            data: note,
            message: 'Note added successfully'
        };
    }

    /**
     * Get application notes (admin)
     */
    async getApplicationNotes(applicationId: string, includeInternal = true) {
        const where: any = { applicationId };
        if (!includeInternal) {
            where.isInternal = false;
        }

        const notes = await this.prisma.applicationNote.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            data: notes
        };
    }

    /**
     * Get application statistics (admin dashboard)
     */
    async getApplicationStats() {
        const [
            total,
            byStatus,
            byLoanType,
            recentApplications,
            thisMonth,
            lastMonth
        ] = await Promise.all([
            this.prisma.loanApplication.count(),
            this.prisma.loanApplication.groupBy({
                by: ['status'],
                _count: true
            }),
            this.prisma.loanApplication.groupBy({
                by: ['loanType'],
                _count: true,
                _sum: { amount: true }
            }),
            this.prisma.loanApplication.findMany({
                take: 5,
                orderBy: { date: 'desc' },
                select: {
                    id: true,
                    applicationNumber: true,
                    loanType: true,
                    amount: true,
                    status: true,
                    date: true,
                    firstName: true,
                    lastName: true,
                }
            }),
            this.prisma.loanApplication.count({
                where: {
                    date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                }
            }),
            this.prisma.loanApplication.count({
                where: {
                    date: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                        lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),
        ]);

        const statusStats = byStatus.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {} as Record<string, number>);

        const loanTypeStats = byLoanType.map(lt => ({
            type: lt.loanType,
            count: lt._count,
            totalAmount: lt._sum.amount
        }));

        return {
            success: true,
            data: {
                total,
                statusStats,
                loanTypeStats,
                recentApplications,
                monthlyComparison: {
                    thisMonth,
                    lastMonth,
                    change: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0
                }
            }
        };
    }

    // ==================== HELPER METHODS ====================

    /**
     * Generate application number
     */
    private generateApplicationNumber(loanType: string): string {
        const prefix = {
            education: 'EDU',
            home: 'HME',
            personal: 'PRS',
            business: 'BUS',
            vehicle: 'VEH',
        }[loanType] || 'APP';

        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();

        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Create status history entry
     */
    private async createStatusHistory(applicationId: string, data: {
        fromStatus?: string;
        toStatus: string;
        fromStage?: string;
        toStage?: string;
        changedBy?: string;
        changedByName?: string;
        changeReason?: string;
        notes?: string;
        isAutomatic?: boolean;
    }) {
        return this.prisma.applicationStatusHistory.create({
            data: {
                applicationId,
                ...data,
            }
        });
    }

    /**
     * Get required documents list for a loan type
     */
    getRequiredDocuments(loanType: string) {
        return {
            success: true,
            data: REQUIRED_DOCUMENTS[loanType as keyof typeof REQUIRED_DOCUMENTS] || REQUIRED_DOCUMENTS.personal
        };
    }

    /**
     * Get application stages
     */
    getApplicationStages() {
        return {
            success: true,
            data: APPLICATION_STAGES
        };
    }
}
