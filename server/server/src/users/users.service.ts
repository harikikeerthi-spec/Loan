import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByMobile(mobile: string) {
    // Strip non-numeric characters for comparison just in case
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanMobileNoCountry = cleanMobile.length > 10 && cleanMobile.startsWith('91') ? cleanMobile.substring(2) : cleanMobile;

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: mobile },
          { phoneNumber: mobile },
          { mobile: cleanMobileNoCountry },
          { phoneNumber: cleanMobileNoCountry },
          { mobile: { endsWith: cleanMobileNoCountry } },
          { phoneNumber: { endsWith: cleanMobileNoCountry } }
        ],
      },
    });
  }

  async create(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    mobile?: string;
    password?: string
  }) {
    // Convert DD-MM-YYYY to Date object
    let dobDate: Date | null = null;
    if (data.dateOfBirth) {
      const dobParts = data.dateOfBirth.split('-');
      if (dobParts.length === 3) {
        const day = parseInt(dobParts[0], 10);
        const month = parseInt(dobParts[1], 10) - 1; // Month is 0-indexed in JavaScript
        const year = parseInt(dobParts[2], 10);
        dobDate = new Date(year, month, day);
      }
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phoneNumber: data.phoneNumber || null,
        dateOfBirth: dobDate,
        mobile: data.mobile || '',
        password: data.password || '',
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async updateUserDetails(
    email: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    dateOfBirth: string
  ) {
    // Convert DD-MM-YYYY to Date object
    let dobDate: Date | null = null;
    if (dateOfBirth) {
      const dobParts = dateOfBirth.split('-');
      if (dobParts.length === 3) {
        const day = parseInt(dobParts[0], 10);
        const month = parseInt(dobParts[1], 10) - 1; // Month is 0-indexed in JavaScript
        const year = parseInt(dobParts[2], 10);
        dobDate = new Date(year, month, day);
      }
    }

    return this.prisma.user.update({
      where: { email },
      data: {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dobDate,
      },
    });
  }

  async updateRefreshToken(email: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { email },
      data: {
        refreshToken,
      },
    });
  }

  async updateUserRole(email: string, role: 'admin' | 'user') {
    return this.prisma.user.update({
      where: { email },
      data: { role },
    });
  }

  // Loan Application Methods
  async createLoanApplication(userId: string, data: {
    bank: string;
    loanType: string;
    amount: number;
    purpose?: string;
    courseType?: string;
    country?: string;
    university?: string;
    annualFee?: string;
    livingCost?: string;
    coApplicant?: string;
    income?: string;
    collateral?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    notes?: string;
  }) {
    return this.prisma.loanApplication.create({
      data: {
        userId,
        bank: data.bank,
        loanType: data.loanType,
        amount: data.amount,
        purpose: data.purpose || null,
        universityName: data.university || null,
        country: data.country || null,
        courseName: data.courseType || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address || null,
        hasCoApplicant: !!data.coApplicant && data.coApplicant !== 'none',
        coApplicantRelation: data.coApplicant !== 'none' ? data.coApplicant : null,
        coApplicantIncome: data.income ? parseFloat(data.income) : null,
        hasCollateral: !!data.collateral && data.collateral !== 'no',
        collateralType: data.collateral !== 'no' ? data.collateral : null,
        remarks: data.notes || null,
        status: 'pending',
        stage: 'application_submitted',
        progress: 10,
        submittedAt: new Date(),
      },
    });
  }

  async getUserApplications(userId: string) {
    return this.prisma.loanApplication.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async updateLoanApplicationStatus(applicationId: string, status: string) {
    return this.prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status },
    });
  }

  async deleteLoanApplication(applicationId: string) {
    return this.prisma.loanApplication.delete({
      where: { id: applicationId },
    });
  }

  // Document Methods
  async upsertUserDocument(userId: string, docType: string, data: {
    uploaded: boolean;
    status?: string;
    filePath?: string;
    digilockerTxId?: string;
    verifiedAt?: Date;
    verificationMetadata?: any;
  }) {
    return this.prisma.userDocument.upsert({
      where: {
        userId_docType: {
          userId,
          docType,
        },
      },
      update: {
        uploaded: data.uploaded,
        status: data.status || 'pending',
        filePath: data.filePath || null,
        uploadedAt: data.uploaded ? new Date() : null,
        digilockerTxId: data.digilockerTxId || undefined,
        verifiedAt: data.verifiedAt || undefined,
        verificationMetadata: data.verificationMetadata || undefined,
      },
      create: {
        userId,
        docType,
        uploaded: data.uploaded,
        status: data.status || 'pending',
        filePath: data.filePath || null,
        uploadedAt: data.uploaded ? new Date() : null,
        digilockerTxId: data.digilockerTxId || null,
        verifiedAt: data.verifiedAt || null,
        verificationMetadata: data.verificationMetadata || null,
      },
    });
  }

  async getUserDocuments(userId: string) {
    return this.prisma.userDocument.findMany({
      where: { userId },
      orderBy: { docType: 'asc' },
    });
  }

  async deleteUserDocument(userId: string, docType: string) {
    return this.prisma.userDocument.delete({
      where: {
        userId_docType: {
          userId,
          docType,
        },
      },
    });
  }

    // Get user dashboard data with all applications, documents and full activity feed
    async getUserDashboardData(userId: string) {
        try {
            const applications = await this.getUserApplications(userId) || [];
            const documents = await this.getUserDocuments(userId) || [];

            // Fetch more activity sources
            const userWithActivity = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    eligibilityChecks: true,
                    visaMockInterviews: true,
                    forumPosts: true,
                    forumComments: true,
                    universityInquiries: true,
                } as any,
            }) as any;

            const inquiries = userWithActivity?.universityInquiries || [];

            // Build activity feed from real data
            const activity: Array<{
                type: string;
                title: string;
                description: string;
                timestamp: string;
                link?: string;
            }> = [];

            // Add application events
            for (const app of applications) {
                const ts = app.submittedAt || app.date;
                activity.push({
                    type: 'application',
                    title: `Loan Application — ${app.bank}`,
                    description: `₹${(app.amount || 0).toLocaleString('en-IN')} ${app.loanType || ''}${app.universityName ? ` for ${app.universityName}` : ''}. Status: ${app.status || 'pending'}`,
                    timestamp: ts instanceof Date ? ts.toISOString() : new Date(ts).toISOString(),
                    link: '/dashboard',
                });
            }

            // Add document upload events
            for (const doc of documents) {
                if (doc.uploaded) {
                    const ts = doc.uploadedAt || doc.createdAt;
                    activity.push({
                        type: 'upload',
                        title: `Document Uploaded`,
                        description: `${(doc.docType || '').replace('_', ' ')} uploaded successfully`,
                        timestamp: ts instanceof Date ? ts.toISOString() : new Date(ts).toISOString(),
                        link: '/document-vault',
                    });
                }
            }

            // Add Inquiries
            for (const inq of inquiries) {
                activity.push({
                    type: inq.type === 'callback' ? 'callback' : 'inquiry',
                    title: inq.type === 'callback' ? 'Callback Requested' : 'Fasttrack Application',
                    description: `University: ${inq.universityName || 'N/A'}. Status: ${inq.status || 'pending'}`,
                    timestamp: (inq.createdAt instanceof Date ? inq.createdAt : new Date(inq.createdAt)).toISOString(),
                    link: '/explore',
                });
            }

            // Add Eligibility Checks
            if (userWithActivity?.eligibilityChecks) {
                for (const check of userWithActivity.eligibilityChecks) {
                    activity.push({
                        type: 'eligibility',
                        title: `Eligibility Result: ${check.status || 'Success'}`,
                        description: `Score: ${check.score || 0}% for loan of ₹${(check.loan || 0).toLocaleString('en-IN')}`,
                        timestamp: (check.createdAt instanceof Date ? check.createdAt : new Date(check.createdAt)).toISOString(),
                        link: '/loan-eligibility',
                    });
                }
            }

            // Add Visa Mock Interviews
            if (userWithActivity?.visaMockInterviews) {
                for (const interview of userWithActivity.visaMockInterviews) {
                    activity.push({
                        type: 'visa_mock',
                        title: `Visa Mock Interview — ${interview.visaType || 'F1'}`,
                        description: `Likelihood: ${interview.approvalLikelihood || 'High'}. Risk: ${interview.overallRisk || 'Low'}. Score: ${interview.overallScore || 0}/10`,
                        timestamp: (interview.createdAt instanceof Date ? interview.createdAt : new Date(interview.createdAt)).toISOString(),
                        link: '/visa-mock',
                    });
                }
            }

            // Add Forum Activities
            if (userWithActivity?.forumPosts) {
                for (const post of userWithActivity.forumPosts) {
                    activity.push({
                        type: 'forum_post',
                        title: `Forum Post: ${post.title || 'Untitled'}`,
                        description: (post.content || '').substring(0, 100) + '...',
                        timestamp: (post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt)).toISOString(),
                        link: `/community/forum/${post.id}`,
                    });
                }
            }

            if (userWithActivity?.forumComments) {
                for (const comment of userWithActivity.forumComments) {
                    activity.push({
                        type: 'forum_comment',
                        title: `Commented on Forum`,
                        description: (comment.content || '').substring(0, 100) + '...',
                        timestamp: (comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)).toISOString(),
                        link: `/community/forum/${comment.postId}`,
                    });
                }
            }

            // Sort by timestamp descending
            activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            const sanitizedUser = userWithActivity ? { ...userWithActivity } : null;
            if (sanitizedUser) {
                delete sanitizedUser.password;
                delete sanitizedUser.refreshToken;
            }

            return {
                applications,
                documents,
                activity: activity.slice(0, 15), // Top 15 activities
                applicationCount: applications.length,
                user: sanitizedUser,
            };
        } catch (error) {
            console.error('Error in getUserDashboardData:', error);
            throw error; // Re-throw to be caught by the controller
        }
    }
}