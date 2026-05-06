import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configure SMTP transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    const timestamp = new Date().toLocaleTimeString();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LoanHero" <noreply@loanhero.com>',
      to: email,
      subject: `Your LoanHero OTP Verification Code [${timestamp}]`,
      text: `Your OTP is: ${otp}. This code expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">LoanHero</h1>
          </div>
          <div style="background: #f7f5f8; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Your Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Use the following OTP to complete your authentication:</p>
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6605c7;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 14px;">This code expires in 5 minutes. Do not share this code with anyone.</p>
          </div>
        </div>
      `,
    };

    try {
      // Always log to console for debugging
      console.log(`[EmailService] PREPARING TO SEND OTP`);
      console.log(`[EmailService] Target Email: ${email}`);
      console.log(`[EmailService] OTP Value: ${otp}`);
      console.log(`--------------------------------`);

      // Send actual email if credentials are configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
      } else {
        console.log(`Email credentials not configured - OTP only logged to console`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw - still allow OTP flow to work even if email fails
      console.log(`Email failed but OTP is: ${otp}`);
    }
  }

  async sendDigilockerConsentRequest(email: string, consentLink: string, documentTypes: string[]) {
    const timestamp = new Date().toLocaleTimeString();
    const docListHtml = documentTypes.map(doc => `<li>${doc.replace(/_/g, ' ').toUpperCase()}</li>`).join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Vidhya Loan" <noreply@vidhyaloan.com>',
      to: email,
      subject: `Action Required: DigiLocker Document Consent Request [${timestamp}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Vidhya Loan</h1>
          </div>
          
          <div style="padding: 0 10px;">
            <h2 style="color: #111827; margin-bottom: 16px;">Document Verification Request</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You have requested to sync the following documents from your DigiLocker account to Vidhya Loan:</p>
            
            <ul style="color: #4b5563; font-size: 14px; background: #f9fafb; padding: 20px 40px; border-radius: 8px; margin: 20px 0;">
              ${docListHtml}
            </ul>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">To proceed with the verification, please click the button below to grant permission and log in to your DigiLocker account.</p>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${consentLink}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                Give Permission & Login
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                If you did not initiate this request, please ignore this email.<br>
                For your security, do not share this link with anyone.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      console.log(`[EmailService] SENDING DIGILOCKER CONSENT TO: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`Consent email sent successfully to ${email}`);
      } else {
        console.log(`Email credentials not configured - Link: ${consentLink}`);
      }
    } catch (error) {
      console.error('Error sending consent email:', error);
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Vidhya Loan" <noreply@vidhyaloan.com>',
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
      } else {
        console.log(`Email credentials not configured - Subject: ${subject}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
