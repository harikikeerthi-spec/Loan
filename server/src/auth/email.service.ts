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
      from: process.env.EMAIL_FROM || '"VidhyaLoan" <noreply@vidhyaloan.com>',
      to: email,
      subject: `Your VidhyaLoan OTP Verification Code [${timestamp}]`,
      text: `Your OTP is: ${otp}. This code expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">VidhyaLoan</h1>
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

  async sendMail(to: string, subject: string, html: string, text?: string, replyTo?: string) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Vidhya Loan" <noreply@vidhyaloan.com>',
      to: to,
      replyTo: replyTo,
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

  /**
   * Send a welcome / thank-you email to a brand-new user after their first login.
   * Introduces Vidhyaloan and guides them toward applying for a loan.
   */
  async sendWelcomeEmail(email: string, firstName?: string) {
    const name = firstName ? firstName : 'there';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Vidhyaloan" <noreply@vidhyaloan.com>',
      to: email,
      subject: '🎉 Welcome to Vidhyaloan – Your Education Loan Journey Starts Here!',
      text: `Hi ${name},\n\nThank you for joining Vidhyaloan! We're thrilled to have you on board.\n\nVidhyaloan helps students like you get fast and easy education loans with minimal paperwork. Here's how to get started:\n\n1. Complete your profile\n2. Upload your documents digitally via DigiLocker\n3. Choose your preferred bank\n4. Track your application in real time\n\nStart your application now: ${frontendUrl}\n\nWarm regards,\nThe Vidhyaloan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Vidhyaloan</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a6e 0%,#3a3acc 60%,#6366f1 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:800;letter-spacing:-0.5px;">Vidhyaloan</h1>
              <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;letter-spacing:1px;">EDUCATION LOAN PLATFORM</p>
            </td>
          </tr>

          <!-- Hero Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);padding:30px 40px;text-align:center;">
              <p style="margin:0;font-size:36px;">🎉</p>
              <h2 style="color:#ffffff;margin:12px 0 8px;font-size:24px;font-weight:700;">Welcome, ${name}!</h2>
              <p style="color:#e0e7ff;margin:0;font-size:15px;line-height:1.6;">Thank you for joining Vidhyaloan. Your education dream just got a powerful ally!</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;">

              <!-- Thank You Message -->
              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">We're genuinely excited to have you with us. Vidhyaloan was built with one mission — to make education loan applications <strong>fast, simple, and stress-free</strong> for every student in India.</p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;" />

              <!-- How It Works -->
              <h3 style="color:#1e1b4b;font-size:18px;font-weight:700;margin:0 0 20px;">🚀 How to Apply – It's Super Easy!</h3>

              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Step 1 -->
                <tr>
                  <td style="padding:12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px;vertical-align:top;">
                          <div style="background:#4338ca;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;">1</div>
                        </td>
                        <td style="vertical-align:top;padding-left:12px;">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">Complete Your Profile</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">Fill in your personal and academic details. It takes less than 5 minutes.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td style="padding:12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px;vertical-align:top;">
                          <div style="background:#4338ca;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;">2</div>
                        </td>
                        <td style="vertical-align:top;padding-left:12px;">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">Upload Documents via DigiLocker</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">No physical paperwork! Sync your ID, marksheets, and more directly from DigiLocker — 100% digital and secure.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td style="padding:12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px;vertical-align:top;">
                          <div style="background:#4338ca;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;">3</div>
                        </td>
                        <td style="vertical-align:top;padding-left:12px;">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">Choose Your Bank</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">Compare loan offers from top banks and pick the one that fits your needs — interest rate, tenure, and more.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 4 -->
                <tr>
                  <td style="padding:12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px;vertical-align:top;">
                          <div style="background:#4338ca;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;">4</div>
                        </td>
                        <td style="vertical-align:top;padding-left:12px;">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">Track Your Application in Real Time</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">Get instant updates at every stage — from submission to approval. No more waiting in the dark!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Key Benefits -->
              <div style="background:#f5f3ff;border-left:4px solid #6366f1;border-radius:8px;padding:20px 24px;margin:28px 0;">
                <h4 style="color:#1e1b4b;margin:0 0 12px;font-size:15px;font-weight:700;">✨ Why Students Love Vidhyaloan</h4>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="padding:4px 0;color:#4c1d95;font-size:13px;">✅ 100% Online Application</td>
                    <td width="50%" style="padding:4px 0;color:#4c1d95;font-size:13px;">⚡ Fast Approval Process</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#4c1d95;font-size:13px;">🔒 Secure Document Handling</td>
                    <td style="padding:4px 0;color:#4c1d95;font-size:13px;">🏦 Multiple Bank Options</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#4c1d95;font-size:13px;">📊 Real-Time Status Tracking</td>
                    <td style="padding:4px 0;color:#4c1d95;font-size:13px;">🎓 Student-First Approach</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0 24px;">
                <a href="${frontendUrl}" style="display:inline-block;background:linear-gradient(135deg,#4338ca,#6366f1);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
                  🚀 Start My Loan Application
                </a>
              </div>

              <!-- Footer Note -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;margin:0;">If you have any questions, just reply to this email — we're always here to help!<br/>© ${new Date().getFullYear()} Vidhyaloan. All rights reserved.</p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    try {
      console.log(`[EmailService] Sending welcome email to new user: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Welcome email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – welcome email skipped for ${email}`);
      }
    } catch (error) {
      // Non-fatal: never block the login flow because of a welcome email failure
      console.error(`[EmailService] Failed to send welcome email to ${email}:`, error);
    }
  }
}
