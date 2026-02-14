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
    password?: string;
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
    dateOfBirth: string,
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

  // Loan Application Methods
  async createLoanApplication(userId: string, data: {
    bank: string;
    loanType: string;
    amount: number;
    purpose?: string;
  }) {
    return this.prisma.loanApplication.create({
      data: {
        userId,
        bank: data.bank,
        loanType: data.loanType,
        amount: data.amount,
        purpose: data.purpose || null,
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

    return {
      applications,
      documents,
    };
  }
}
