import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class UniversityInquiryService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  async createInquiry(data: {
    userId?: string;
    name: string;
    email: string;
    mobile: string;
    universityName: string;
    type: 'callback' | 'fasttrack';
  }) {
    const inquiry = await this.prisma.universityInquiry.create({
      data: {
        userId: data.userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        universityName: data.universityName,
        type: data.type,
      },
    });

    // Send notification email
    await this.sendInquiryEmails(data);

    return inquiry;
  }

  async getInquiriesByUser(userId: string) {
    return this.prisma.universityInquiry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkInquiry(email: string, universityName: string, type: string) {
    const existing = await this.prisma.universityInquiry.findFirst({
      where: {
        email,
        universityName,
        type,
      },
    });
    return { exists: !!existing };
  }

  private async sendInquiryEmails(data: any) {
    const typeLabel = data.type === 'callback' ? 'Request a Callback' : 'Fasttrack Application';

    // User Confirmation Email
    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vidhya Loan</h1>
        </div>
        <div style="padding: 0 10px;">
          <h2 style="color: #111827; margin-bottom: 16px;">We've received your request!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi ${data.name},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">We have received your ${typeLabel.toLowerCase()} inquiry for <strong>${data.universityName}</strong>.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Mobile:</strong> ${data.mobile}</p>
            <p style="margin: 5px 0;"><strong>University:</strong> ${data.universityName}</p>
            <p style="margin: 5px 0;"><strong>Request:</strong> ${typeLabel}</p>
          </div>
          <p style="color: #4b5563; font-size: 16px;">Our education consultants will call you shortly.</p>
        </div>
      </div>
    `;

    // Admin Lead Email
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>New Lead Generated</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Mobile:</strong> ${data.mobile}</p>
        <p><strong>University:</strong> ${data.universityName}</p>
        <p><strong>Lead Type:</strong> ${typeLabel}</p>
      </div>
    `;

    try {
      // Send to user
      await this.emailService.sendMail(data.email, `Inquiry Received: ${data.universityName}`, userHtml);
      // Send to admin
      await this.emailService.sendMail(process.env.ADMIN_EMAIL || 'admin@vidhyaloan.com', `NEW LEAD: ${data.name} - ${typeLabel}`, adminHtml);
    } catch (e) {
      console.error('Error sending lead emails', e);
    }
  }
}
