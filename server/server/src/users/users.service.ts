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

  async updateUserRole(email: string, role: 'admin' | 'user') {
    return this.prisma.user.update({
      where: { email },
      data: { role },
    });
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
        applicationNumber: 'APP' + Date.now() + Math.floor(Math.random() * 1000),
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
        uploadedAt: data.uploaded ? new Date() : undefined,
      },
      create: {
        userId,
        docType,
        uploaded: data.uploaded,
        status: data.status || 'pending',
        filePath: data.filePath || null,
        uploadedAt: data.uploaded ? new Date() : undefined,
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

  // Get user dashboard data with all applications, documents, and recent activity
  async getUserDashboardData(userId: string) {
    const applications = await this.getUserApplications(userId);
    const documents = await this.getUserDocuments(userId);
    const activity = await this.getUserRecentActivity(userId);

    return {
      applications,
      documents,
      activity,
    };
  }

  // Get user's recent activity across all features (forum posts, comments, blog comments, likes, applications)
  async getUserRecentActivity(userId: string, limit: number = 20) {
    const activities: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: string;
      link?: string;
    }> = [];

    try {
      // 1. Forum posts by user
      const forumPosts = await this.prisma.forumPost.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          createdAt: true,
        },
      });

      for (const post of forumPosts) {
        activities.push({
          type: 'forum_post',
          title: 'Posted in Community Forum',
          description: post.title || post.content.substring(0, 80) + (post.content.length > 80 ? '...' : ''),
          timestamp: post.createdAt.toISOString(),
          link: `community-categories.html?post=${post.id}`,
        });
      }

      // 2. Forum comments by user
      const forumComments = await this.prisma.forumComment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      for (const comment of forumComments) {
        activities.push({
          type: 'forum_comment',
          title: 'Commented on Forum Post',
          description: comment.post.title
            ? `On "${comment.post.title}": ${comment.content.substring(0, 60)}${comment.content.length > 60 ? '...' : ''}`
            : comment.content.substring(0, 80) + (comment.content.length > 80 ? '...' : ''),
          timestamp: comment.createdAt.toISOString(),
          link: `community-categories.html?post=${comment.post.id}`,
        });
      }

      // 3. Blog comments by user
      const blogComments = await this.prisma.comment.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      for (const comment of blogComments) {
        activities.push({
          type: 'blog_comment',
          title: 'Commented on Blog',
          description: `On "${comment.blog.title}": ${comment.content.substring(0, 60)}${comment.content.length > 60 ? '...' : ''}`,
          timestamp: comment.createdAt.toISOString(),
          link: `blog-article.html?slug=${comment.blog.slug}`,
        });
      }

      // 4. Forum post likes by user
      const postLikes = await this.prisma.postLike.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              content: true,
            },
          },
        },
      });

      for (const like of postLikes) {
        activities.push({
          type: 'post_like',
          title: 'Liked a Forum Post',
          description: like.post.title || like.post.content.substring(0, 80) + (like.post.content.length > 80 ? '...' : ''),
          timestamp: like.createdAt.toISOString(),
          link: `community-categories.html?post=${like.post.id}`,
        });
      }

      // 5. Loan applications
      const applications = await this.prisma.loanApplication.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true,
          bank: true,
          loanType: true,
          amount: true,
          status: true,
          date: true,
        },
      });

      for (const app of applications) {
        activities.push({
          type: app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'application',
          title: app.status === 'approved' ? 'Application Approved' : app.status === 'rejected' ? 'Application Rejected' : 'Application Submitted',
          description: `${app.bank} - ${app.loanType} • ₹${app.amount.toLocaleString('en-IN')}`,
          timestamp: app.date.toISOString(),
        });
      }

      // 6. Document uploads
      const documents = await this.prisma.userDocument.findMany({
        where: { userId: userId, uploaded: true },
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        select: {
          docType: true,
          uploadedAt: true,
          createdAt: true,
        },
      });

      const docLabels: Record<string, string> = {
        aadhar: 'Aadhar Card',
        pan: 'PAN Card',
        passport: 'Passport',
        '10th': '10th Marksheet',
        '12th': '12th Marksheet',
        degree: 'Degree Certificate',
      };

      for (const doc of documents) {
        activities.push({
          type: 'upload',
          title: 'Document Uploaded',
          description: docLabels[doc.docType] || doc.docType,
          timestamp: (doc.uploadedAt || doc.createdAt).toISOString(),
        });
      }

    } catch (error) {
      console.error('Error fetching user recent activity:', error);
    }

    // Sort all activities by timestamp descending and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, limit);
  }
}