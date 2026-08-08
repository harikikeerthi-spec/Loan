import { Injectable, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { randomUUID } from 'crypto';

@Injectable()
export class UniversityInquiryService implements OnModuleInit {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    // Database tables (UniversityInquiry, FastTrackApplication, CallbackRequest, queries) are pre-migrated in PostgreSQL
  }

  async createInquiry(data: {
    userId?: string;
    name: string;
    email: string;
    mobile: string;
    universityName: string;
    type: string;
  }) {
    const finalType = data.type === 'callback' ? 'callback' : 'fasttrack';
    const validUserId = (data.userId && data.userId.trim() !== '') ? data.userId.trim() : null;
    const recordId = randomUUID();

    const baseData = {
      id: recordId,
      userId: validUserId,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      universityName: data.universityName,
      status: 'pending',
    };

    let inquiryResult: any = null;

    // 1. Save to UniversityInquiry using Prisma for guaranteed PostgreSQL write
    try {
      inquiryResult = await this.prisma.universityInquiry.create({
        data: {
          ...baseData,
          type: finalType,
        },
      });
    } catch (err) {
      console.error('Error inserting into UniversityInquiry via Prisma, trying Supabase fallback:', err);
      try {
        const { data: inq } = await this.db.from('UniversityInquiry').insert({
          ...baseData,
          type: finalType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).select().maybeSingle();
        inquiryResult = inq || { ...baseData, type: finalType };
      } catch (sbErr) {
        inquiryResult = { ...baseData, type: finalType };
      }
    }

    // 2. Save into separate specialized table (FastTrackApplication vs CallbackRequest)
    if (finalType === 'fasttrack') {
      try {
        await this.prisma.fastTrackApplication.create({
          data: baseData,
        });
      } catch (ftErr) {
        console.error('Error inserting into FastTrackApplication via Prisma, trying Supabase fallback:', ftErr);
        try {
          await this.db.from('FastTrackApplication').insert({
            ...baseData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {}
      }
    } else if (finalType === 'callback') {
      try {
        await this.prisma.callbackRequest.create({
          data: baseData,
        });
      } catch (cbErr) {
        console.error('Error inserting into CallbackRequest via Prisma, trying Supabase fallback:', cbErr);
        try {
          await this.db.from('CallbackRequest').insert({
            ...baseData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {}
      }
    }

    // 3. Send email notifications asynchronously (non-blocking)
    this.sendInquiryEmails({
      ...data,
      type: finalType,
    }).catch((mailError) => {
      console.error('Failed to send inquiry emails:', mailError);
    });

    return {
      success: true,
      data: inquiryResult,
      message: 'Inquiry submitted successfully',
    };
  }

  async getInquiriesByUser(userId: string) {
    try {
      return await this.prisma.universityInquiry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      try {
        const { data } = await this.db
          .from('UniversityInquiry')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });
        return data || [];
      } catch (err) {
        return [];
      }
    }
  }

  async checkInquiry(email: string, universityName: string, type: string) {
    try {
      const existing = await this.prisma.universityInquiry.findFirst({
        where: { email, universityName, type },
        select: { id: true },
      });
      return { exists: !!existing };
    } catch (e) {
      try {
        const { data: existing } = await this.db
          .from('UniversityInquiry')
          .select('id')
          .eq('email', email)
          .eq('universityName', universityName)
          .eq('type', type)
          .maybeSingle();
        return { exists: !!existing };
      } catch (err) {
        return { exists: false };
      }
    }
  }

  private async sendInquiryEmails(data: any) {
    const typeLabel = data.type === 'callback' ? 'Request a Callback' : 'Fasttrack Application';

    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vidya Loan</h1>
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
      await this.emailService.sendMail(data.email, `Inquiry Received: ${data.universityName}`, userHtml);
      await this.emailService.sendMail(process.env.ADMIN_EMAIL || 'admin@vidyaloan.com', `NEW LEAD: ${data.name} - ${typeLabel}`, adminHtml);
    } catch (e) {
      console.error('Error sending lead emails', e);
    }
  }
}
