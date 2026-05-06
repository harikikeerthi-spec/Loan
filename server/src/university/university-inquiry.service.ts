import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class UniversityInquiryService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private emailService: EmailService,
  ) {}

  async createInquiry(data: {
    userId?: string;
    name: string;
    email: string;
    mobile: string;
    universityName: string;
    type: 'callback' | 'fasttrack';
  }) {
    const { data: inquiry, error } = await this.db
      .from('UniversityInquiry')
      .insert({
        userId: data.userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        universityName: data.universityName,
        type: data.type,
      })
      .select()
      .single();

    if (error) throw error;

    await this.sendInquiryEmails(data);
    return inquiry;
  }

  async getInquiriesByUser(userId: string) {
    const { data } = await this.db
      .from('UniversityInquiry')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    return data || [];
  }

  async checkInquiry(email: string, universityName: string, type: string) {
    const { data: existing } = await this.db
      .from('UniversityInquiry')
      .select('id')
      .eq('email', email)
      .eq('universityName', universityName)
      .eq('type', type)
      .single();
    return { exists: !!existing };
  }

  private async sendInquiryEmails(data: any) {
    const typeLabel = data.type === 'callback' ? 'Request a Callback' : 'Fasttrack Application';

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
      await this.emailService.sendMail(process.env.ADMIN_EMAIL || 'admin@vidhyaloan.com', `NEW LEAD: ${data.name} - ${typeLabel}`, adminHtml);
    } catch (e) {
      console.error('Error sending lead emails', e);
    }
  }
}
