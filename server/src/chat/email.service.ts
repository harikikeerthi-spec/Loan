import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com';
    const port = this.configService.get<number>('EMAIL_PORT') || 587;
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const from = this.configService.get<string>('EMAIL_FROM') || `"VidhyaLoan" <${user}>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      from,
    });
  }

  async sendChatNotificationEmail(
    to: string,
    senderName: string,
    senderRole: string,
    message: string,
    conversationContext: {
      applicationNumber?: string;
      customerName?: string;
      bank?: string;
      subject: string;
    }
  ): Promise<boolean> {
    try {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); padding: 40px; border-radius: 16px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">VidhyaLoan</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">New Message in Your Application</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
              <strong>${senderName}</strong> (${senderRole}) has sent you a message regarding your loan application.
            </p>

            ${conversationContext.applicationNumber ? `
              <div style="background: white; padding: 15px; border-left: 4px solid #6605c7; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Application Details</p>
                <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #333;">
                  ${conversationContext.applicationNumber}
                  ${conversationContext.bank ? ` • ${conversationContext.bank}` : ''}
                </p>
              </div>
            ` : ''}

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                ${this.escapeHtml(message)}
              </p>
            </div>

            <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #6605c7; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Subject</p>
              <p style="margin: 8px 0 0 0; color: #333; font-size: 14px;">
                ${this.escapeHtml(conversationContext.subject)}
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard#applications" 
               style="display: inline-block; background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              View Application
            </a>
          </div>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0 0 10px 0;">
              You received this email because you have an active loan application with VidhyaLoan.
            </p>
            <p style="margin: 0;">
              © ${new Date().getFullYear()} VidhyaLoan. All rights reserved.
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        to,
        subject: `New Message: ${conversationContext.subject}`,
        html: htmlContent,
        text: `${senderName} (${senderRole}) sent: ${message}`,
      });

      this.logger.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendDocumentNotificationEmail(
    to: string,
    documentDetails: {
      documentName: string;
      uploadedBy: string;
      uploadedByRole: string;
      applicationNumber: string;
      bank?: string;
      status: string;
    }
  ): Promise<boolean> {
    try {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); padding: 40px; border-radius: 16px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">VidhyaLoan</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Document Shared with You</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
              A document has been shared with you by <strong>${documentDetails.uploadedBy}</strong> (${documentDetails.uploadedByRole}).
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #6605c7; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Document Details</p>
              <p style="margin: 12px 0 8px 0; font-size: 18px; font-weight: bold; color: #333;">
                📄 ${this.escapeHtml(documentDetails.documentName)}
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #6605c7; font-weight: bold;">
                Status: ${documentDetails.status}
              </p>
            </div>

            <div style="background: #f0f4ff; padding: 15px; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6605c7; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Application</p>
              <p style="margin: 0; font-size: 14px; color: #333;">
                ${documentDetails.applicationNumber}
                ${documentDetails.bank ? ` • ${documentDetails.bank}` : ''}
              </p>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/document-vault" 
               style="display: inline-block; background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              View Document
            </a>
          </div>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} VidhyaLoan. All rights reserved.</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        to,
        subject: `Document Shared: ${documentDetails.documentName}`,
        html: htmlContent,
        text: `Document ${documentDetails.documentName} has been shared with you for application ${documentDetails.applicationNumber}`,
      });

      this.logger.log(`Document notification email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send document email to ${to}:`, error);
      return false;
    }
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
