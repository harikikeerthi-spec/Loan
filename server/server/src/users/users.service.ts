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
      },
      create: {
        userId,
        docType,
        uploaded: data.uploaded,
        status: data.status || 'pending',
        filePath: data.filePath || null,
        uploadedAt: data.uploaded ? new Date() : null,
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

  // Get user dashboard data with all applications and documents
  async getUserDashboardData(userId: string) {
    const applications = await this.getUserApplications(userId);
    const documents = await this.getUserDocuments(userId);

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
      activity.push({
        type: 'application',
        title: `Loan Application — ${app.bank}`,
        description: `₹${app.amount?.toLocaleString('en-IN')} ${app.loanType}${app.universityName ? ` for ${app.universityName}` : ''}. Status: ${app.status}`,
        timestamp: (app.submittedAt || app.date)?.toISOString() || new Date().toISOString(),
        link: '/dashboard',
      });
    }

    // Add document upload events
    for (const doc of documents) {
      if (doc.uploaded) {
        activity.push({
          type: 'upload',
          title: `Document Uploaded`,
          description: `${doc.docType.replace('_', ' ')} uploaded successfully`,
          timestamp: (doc.uploadedAt || doc.createdAt)?.toISOString() || new Date().toISOString(),
          link: '/document-vault',
        });
      }
    }

    // Sort by timestamp descending
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      applications,
      documents,
      activity,
    };
  }
}