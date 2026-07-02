import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

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
      from: process.env.EMAIL_FROM || '"VidyaLoan" <[EMAIL_ADDRESS]>',
      to: email,
      subject: `Your VidyaLoan OTP Verification Code`,
      text: `Your OTP is: ${otp}. This code expires in 1 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">VidyaLoan</h1>
          </div>
          <div style="background: #f7f5f8; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Your Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Use the following OTP to complete your authentication:</p>
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6605c7;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 14px;">This code expires in 1 minutes. Do not share this code with anyone.</p>
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
      from: process.env.EMAIL_FROM || '"Vidya Loan" <noreply@vidyaloan.com>',
      to: email,
      subject: `Action Required: DigiLocker Document Consent Request `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Vidya Loan</h1>
          </div>
          
          <div style="padding: 0 10px;">
            <h2 style="color: #111827; margin-bottom: 16px;">Document Verification Request</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You have requested to sync the following documents from your DigiLocker account to Vidya Loan:</p>
            
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

  async sendMail(to: string, subject: string, html: string, text?: string, replyTo?: string, attachments?: any[]) {
    const mailOptions: any = {
      from: process.env.EMAIL_FROM || '"Vidya Loan" <noreply@vidyaloan.com>',
      to: to,
      replyTo: replyTo,
      subject: subject,
      html: html,
      text: text,
    };

    if (attachments) {
      mailOptions.attachments = attachments;
    }

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
   * Introduces Vidyaloan and guides them toward applying for a loan.
   */
  async sendWelcomeEmail(email: string, firstName?: string, lastName?: string) {
    // Delegate to the full dashboard welcome email (supports both cases)
    return this.sendDashboardWelcomeEmail(email, firstName, lastName);
  }

  /**
   * Send a rich, professional welcome email AFTER the user completes their profile
   * and enters the VidyaLoan dashboard for the first time.
   * Includes personalised greeting, loan offerings, platform features, and a CTA.
   */
  async sendDashboardWelcomeEmail(email: string, firstName?: string, lastName?: string) {
    const fullName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : '';
    const name = firstName ? firstName : 'there';
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: fullName ? `"${fullName}" <${email}>` : email,
      subject: `🎓 Welcome to VidyaLoan, ${name}! Your Education Loan Journey Begins`,
      text: `Dear ${name},\n\nWelcome to VidyaLoan – India's smartest education loan platform!\n\nYour profile is set up and your dashboard is ready. Here's what you can do now:\n\n🏦 LOAN OFFERINGS\n• Education loans up to ₹1.5 Crore\n• Competitive interest rates from 8.5% p.a.\n• Moratorium period during studies\n• No collateral for loans up to ₹7.5 Lakh\n• Covers tuition, living, travel, and equipment costs\n\n🚀 HOW TO GET YOUR LOAN IN 4 STEPS\n1. Complete Your Profile – Personal & academic details (done!)\n2. Upload Documents via DigiLocker – 100% digital & secure\n3. Choose Your Bank – Compare offers from 20+ lenders\n4. Track in Real Time – Get updates at every step\n\n✨ PLATFORM FEATURES\n• AI-powered bank matching\n• DigiLocker integration for instant document sync\n• Real-time application tracking\n• Dedicated loan counsellors\n• Community forum & expert blogs\n\nGo to your dashboard: ${frontendUrl}\n\nWarm regards,\nThe VidyaLoan Team\nsupport@vidyaloan.com`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to VidyaLoan – ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- ─────────── HEADER ─────────── -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─────────── HERO ─────────── -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Welcome <span style="color:#fde68a;">${name}!</span>
              </h2>
              <p style="color:#ddd6fe;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                Your VidyaLoan dashboard is ready. Let's turn your education dream into reality with the smartest loan platform in India.
              </p>
            </td>
          </tr>

          <!-- ─────────── MAIN CARD ─────────── -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 8px;">

              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 28px;">
                Dear <strong>${name}</strong>, your profile is now complete and your VidyaLoan account is fully activated. You can now explore loan options, upload documents, and compare bank offers — all in one place.
              </p>

              <!-- ── Divider ── -->
              <div style="height:1px;background:linear-gradient(to right,transparent,#e5e7eb,transparent);margin:0 0 28px;"></div>

            </td>
          </tr>

          <!-- ─────────── LOAN OFFERINGS ─────────── -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 28px;">
              <h3 style="color:#1e1b4b;font-size:17px;font-weight:700;margin:0 0 18px;">
                🏦 What VidyaLoan Offers You
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:0 6px 12px 0;vertical-align:top;">
                    <div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;padding:16px;height:100%;">
                      <p style="margin:0 0 6px;font-size:20px;">💰</p>
                      <p style="margin:0 0 4px;font-weight:700;color:#4c1d95;font-size:13px;">Loans up to ₹1.5 Crore</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">Covers tuition, living, travel, laptop & exam fees</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 12px 6px;vertical-align:top;">
                    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;padding:16px;height:100%;">
                      <p style="margin:0 0 6px;font-size:20px;">📉</p>
                      <p style="margin:0 0 4px;font-weight:700;color:#065f46;font-size:13px;">From 8.5% p.a. Interest</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">Competitive rates compared across 20+ banks & NBFCs</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 6px 12px 0;vertical-align:top;">
                    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;height:100%;">
                      <p style="margin:0 0 6px;font-size:20px;">⏳</p>
                      <p style="margin:0 0 4px;font-weight:700;color:#92400e;font-size:13px;">Study-Period Moratorium</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">No EMI during studies + 6 months after course completion</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 12px 6px;vertical-align:top;">
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;height:100%;">
                      <p style="margin:0 0 6px;font-size:20px;">🔓</p>
                      <p style="margin:0 0 4px;font-weight:700;color:#1e40af;font-size:13px;">No Collateral up to ₹7.5L</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">Unsecured loans available for eligible students</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─────────── STEPS ─────────── -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;padding:28px 40px;">
              <h3 style="color:#1e1b4b;font-size:17px;font-weight:700;margin:0 0 20px;">🚀 Your 4-Step Loan Journey</h3>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="12" style="margin-bottom:14px;">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;width:34px;height:34px;border-radius:10px;text-align:center;line-height:34px;font-weight:800;font-size:15px;">1</div>
                  </td>
                  <td style="vertical-align:top;padding-left:14px;">
                    <p style="margin:0 0 3px;font-weight:700;color:#111827;font-size:14px;">Complete Your Profile ✅</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">You've already done this — your personal and academic details are saved!</p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="12" style="margin-bottom:14px;">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;width:34px;height:34px;border-radius:10px;text-align:center;line-height:34px;font-weight:800;font-size:15px;">2</div>
                  </td>
                  <td style="vertical-align:top;padding-left:14px;">
                    <p style="margin:0 0 3px;font-weight:700;color:#111827;font-size:14px;">Upload Documents via DigiLocker</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Sync Aadhaar, marksheets, admission letter instantly — no physical copies needed.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="12" style="margin-bottom:14px;">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;width:34px;height:34px;border-radius:10px;text-align:center;line-height:34px;font-weight:800;font-size:15px;">3</div>
                  </td>
                  <td style="vertical-align:top;padding-left:14px;">
                    <p style="margin:0 0 3px;font-weight:700;color:#111827;font-size:14px;">Choose Your Bank &amp; Loan Plan</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Our AI compares SBI, HDFC, Axis, ICICI and 15+ lenders to find your best match.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 4 -->
              <table width="100%" cellpadding="0" cellspacing="12">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;width:34px;height:34px;border-radius:10px;text-align:center;line-height:34px;font-weight:800;font-size:15px;">4</div>
                  </td>
                  <td style="vertical-align:top;padding-left:14px;">
                    <p style="margin:0 0 3px;font-weight:700;color:#111827;font-size:14px;">Track Your Application in Real Time</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Get live status updates, instant notifications, and counsellor support at every step.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─────────── PLATFORM FEATURES ─────────── -->
          <tr>
            <td style="background:#ffffff;padding:28px 40px;">
              <h3 style="color:#1e1b4b;font-size:17px;font-weight:700;margin:0 0 16px;">✨ Your Dashboard Features</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 8px 5px 0;color:#374151;font-size:13px;width:50%;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">🤖</span>AI-Powered Bank Matching
                  </td>
                  <td style="padding:5px 0 5px 8px;color:#374151;font-size:13px;width:50%;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">🔗</span>DigiLocker Integration
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 8px 5px 0;color:#374151;font-size:13px;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">📊</span>Real-Time Status Tracker
                  </td>
                  <td style="padding:5px 0 5px 8px;color:#374151;font-size:13px;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">🎓</span>University Shortlisting
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 8px 5px 0;color:#374151;font-size:13px;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">💬</span>Expert Counsellor Chat
                  </td>
                  <td style="padding:5px 0 5px 8px;color:#374151;font-size:13px;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">🏆</span>Student Community Forum
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 8px 5px 0;color:#374151;font-size:13px;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">📚</span>Education Loan Blog &amp; Tips
                  </td>
                  <td style="padding:5px 0 5px 8px;color:#374151;font-size:13px;">
                    <span style="color:#7c3aed;font-weight:700;margin-right:6px;">🔒</span>Bank-Grade Data Security
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─────────── TRUST BADGES ─────────── -->
          <tr>
            <td style="background:#f5f3ff;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:0 8px;">
                    <p style="margin:0 0 4px;font-size:22px;">🏦</p>
                    <p style="margin:0;font-weight:700;color:#4c1d95;font-size:12px;">20+ Banks</p>
                    <p style="margin:0;color:#7c3aed;font-size:11px;">Partner Lenders</p>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <p style="margin:0 0 4px;font-size:22px;">⚡</p>
                    <p style="margin:0;font-weight:700;color:#4c1d95;font-size:12px;">48 Hours</p>
                    <p style="margin:0;color:#7c3aed;font-size:11px;">Avg. Approval Time</p>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <p style="margin:0 0 4px;font-size:22px;">🌍</p>
                    <p style="margin:0;font-weight:700;color:#4c1d95;font-size:12px;">50+ Countries</p>
                    <p style="margin:0;color:#7c3aed;font-size:11px;">Study Destinations</p>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <p style="margin:0 0 4px;font-size:22px;">🎓</p>
                    <p style="margin:0;font-weight:700;color:#4c1d95;font-size:12px;">10,000+</p>
                    <p style="margin:0;color:#7c3aed;font-size:11px;">Students Funded</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─────────── CTA ─────────── -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px;text-align:center;">
              <p style="color:#374151;font-size:14px;margin:0 0 20px;">
                Your dashboard is ready. Start exploring your loan options today!
              </p>
              <a href="${frontendUrl}" style="
                display:inline-block;
                background:linear-gradient(135deg,#4f46e5,#7c3aed);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(124,58,237,0.45);
                mso-padding-alt:16px 44px;
              ">🚀 Go to My Dashboard</a>
            </td>
          </tr>

          <!-- ─────────── SUPPORT ─────────── -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Need help getting started?</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Our loan counsellors are available Mon–Sat, 9 AM – 6 PM IST.</p>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <a href="mailto:support@vidyaloan.com" style="display:inline-block;background:#f5f3ff;color:#7c3aed;text-decoration:none;padding:9px 18px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #ddd6fe;">📧 Contact Support</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─────────── FOOTER ─────────── -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                You received this email because you registered at VidyaLoan.<br/>
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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

  async sendStaffReviewStartedEmail(email: string, userName: string, application: any) {
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();
    const appNum = application.applicationNumber || 'N/A';
    const loanType = (application.loanType || 'Education').toUpperCase();
    const amount = application.amount ? `₹${Number(application.amount).toLocaleString('en-IN')}` : 'N/A';
    const bankName = application.bank || 'our partner bank';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: userName ? `"${userName}" <${email}>` : email,
      subject: `⚡ VidyaLoan Team is Processing Your Application - #${appNum}`,
      text: `Dear ${userName},\n\nGood news! The VidyaLoan review team has officially received and started processing your loan application (No. #${appNum}) for ${bankName}.\n\nApplication Details:\n- Number: #${appNum}\n- Type: ${loanType}\n- Amount: ${amount}\n\nOur loan specialists are checking your documents to fast-track your approval.\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received & Processing - VidyaLoan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #6605c7 0%, #8b5cf6 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:42px;">⚡</p>
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Application Received & Under Review
              </h2>
              <p style="color:#ddd6fe;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                Great news, ${userName}! The VidyaLoan review team has officially started processing your file.
              </p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 20px;">
              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 24px;">
                Dear <strong>${userName}</strong>, <br><br>
                Your education loan application (No. <strong>#${appNum}</strong>) has been picked up by our review team. 
                Our finance and documentation specialists are currently verifying your details to match you with the best loan structures for <strong>${bankName}</strong>.
              </p>

              <!-- Details Summary -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 14px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                📋 Application Summary
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:40%;">Application Number</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:700;font-size:14px;">#${appNum}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Lender Partner</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:600;font-size:14px;">${bankName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Loan Category</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${loanType}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Requested Principal</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6605c7;font-weight:700;font-size:14px;">${amount}</td>
                </tr>
              </table>

              <!-- Progress bar container -->
              <div style="background:#f3f4f6; border-radius:10px; height:8px; width:100%; margin:28px 0 12px; overflow:hidden;">
                <div style="background:linear-gradient(to right, #6605c7, #8b5cf6); height:100%; width:30%; border-radius:10px;"></div>
              </div>
              <p style="color:#4b5563; font-size:12px; font-weight:600; margin:0 0 28px; text-align:right;">
                Overall Progress: 30% completed
              </p>

              <!-- Timeline -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 20px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                📍 Tracking Pipeline
              </h3>
              
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <!-- Step 1 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Application Submitted</span>
                    <span style="color: #059669; font-size: 11px; font-weight: 600; text-transform: uppercase;">Completed</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Your application has been received and registered under number #${appNum}.</p>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #8b5cf6; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">2</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">VidyaLoan Review</span>
                    <span style="color: #8b5cf6; font-size: 11px; font-weight: 600; text-transform: uppercase;">Active Review</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Our team is actively reviewing your qualifications and matching your profile with loan structures.</p>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">3</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Credit Check</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">System performs background financial and credit score checks.</p>
                  </td>
                </tr>
                <!-- Step 4 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">4</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Bank Review</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Our partner bank will review the details for eligibility.</p>
                  </td>
                </tr>
                <!-- Step 5 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">5</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Sanction Offer</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Official sanction letter is issued with specific loan interest rate & terms.</p>
                  </td>
                </tr>
                <!-- Step 6 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">6</div>
                  </td>
                  <td valign="top" style="padding-left: 12px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Disbursement</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Funds are transferred directly to the educational institution.</p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 14px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                ⚙️ What our team is doing:
              </h3>
              
              <ul style="color:#4b5563; font-size:13px; line-height:1.6; padding-left:20px; margin-bottom:28px;">
                <li style="margin-bottom:8px;">Verifying your academic qualifications and university details.</li>
                <li style="margin-bottom:8px;">Performing a preliminary credit eligibility check.</li>
                <li style="margin-bottom:8px;">Reviewing co-applicant financial profiles and required documentation.</li>
              </ul>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="${frontendUrl}/dashboard" style="
                display:inline-block;
                background:linear-gradient(135deg,#6605c7,#8b5cf6);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(102,5,199,0.3);
              ">🚀 Track Live Processing Status</a>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Registered Email Address</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">This update was sent to ${email} registered with your account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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
      console.log(`[EmailService] Sending staff review started email to: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Staff review started email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – staff review email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send staff review started email to ${email}:`, error);
    }
  }

  async sendLoanSubmissionEmail(email: string, userName: string, bankName: string, application: any) {
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();
    const appNum = application.applicationNumber || 'N/A';
    const loanType = (application.loanType || 'Education').toUpperCase();
    const amount = application.amount ? `₹${Number(application.amount).toLocaleString('en-IN')}` : 'N/A';
    const tenure = application.tenure ? `${application.tenure} months` : 'N/A';
    const university = application.universityName || 'N/A';
    const course = application.courseName || 'N/A';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: userName ? `"${userName}" <${email}>` : email,
      subject: `📝 Loan Application Submitted Successfully - #${appNum}`,
      text: `Dear ${userName},\n\nYour loan application for ${bankName} has been submitted successfully.\n\nApplication Number: ${appNum}\nLoan Type: ${loanType}\nAmount: ${amount}\nBank Name: ${bankName}\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Submitted - VidyaLoan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #059669 0%, #10b981 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:42px;">📝</p>
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Application Submitted!
              </h2>
              <p style="color:#d1fae5;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                Great job, ${userName}! Your loan application has been successfully submitted and is now under review.
              </p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 20px;">
              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 24px;">
                Dear <strong>${userName}</strong>, <br><br>
                Thank you for choosing VidyaLoan. We have received your loan application for <strong>${bankName}</strong>. Below is a summary of your application details. Please retain this information for your records.
              </p>

              <!-- Application Details Table/Grid -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 14px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                📋 Application Summary
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:40%;">Application Number</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:700;font-size:14px;">#${appNum}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Bank Partner</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:600;font-size:14px;">${bankName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Loan Type</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${loanType}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Requested Amount</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#059669;font-weight:700;font-size:14px;">${amount}</td>
                </tr>
                ${tenure !== 'N/A' ? `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Tenure</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${tenure}</td>
                </tr>` : ''}
                ${university !== 'N/A' ? `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">University</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${university}</td>
                </tr>` : ''}
                ${course !== 'N/A' ? `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Course</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${course}</td>
                </tr>` : ''}
              </table>
              
              <!-- Next Steps -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 14px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                ⚡ What Happens Next?
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:30px;">
                    <div style="background:#ede9fe;color:#7c3aed;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;font-size:12px;">1</div>
                  </td>
                  <td style="padding:8px 0 8px 10px;color:#4b5563;font-size:13px;line-height:1.5;">
                    <strong style="color:#111827;">Document Verification:</strong> Please ensure all required documents are uploaded. You can instantly link your DigiLocker profile to automatically sync your verified identity and academic certificates for faster approval.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <div style="background:#ede9fe;color:#7c3aed;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;font-size:12px;">2</div>
                  </td>
                  <td style="padding:8px 0 8px 10px;color:#4b5563;font-size:13px;line-height:1.5;">
                    <strong style="color:#111827;">Credit Check & Review:</strong> Our financial team and <strong>${bankName}</strong>'s underwriters will perform credit verification.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <div style="background:#ede9fe;color:#7c3aed;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-weight:bold;font-size:12px;">3</div>
                  </td>
                  <td style="padding:8px 0 8px 10px;color:#4b5563;font-size:13px;line-height:1.5;">
                    <strong style="color:#111827;">Sanction & Disbursement:</strong> Upon successful verification, you will receive the loan sanction letter with the terms of your education loan.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="${frontendUrl}/dashboard" style="
                display:inline-block;
                background:linear-gradient(135deg,#059669,#10b981);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(16,185,129,0.4);
              ">🚀 Track Application Status</a>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Need any assistance?</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Our loan counsellors are here to guide you step-by-step.</p>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <a href="mailto:support@vidyaloan.com" style="display:inline-block;background:#f5f3ff;color:#7c3aed;text-decoration:none;padding:9px 18px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #ddd6fe;">📧 Contact Support</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                You received this email because you registered at VidyaLoan.<br/>
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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
      console.log(`[EmailService] Sending loan submission email to: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Loan submission email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – loan submission email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send loan submission email to ${email}:`, error);
    }
  }

  async sendLoanTrackingEmail(email: string, userName: string, bankName: string, application: any) {
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();
    const appNum = application.applicationNumber || 'N/A';
    const loanType = (application.loanType || 'Education').toUpperCase();
    const progress = application.progress || 15;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: email,
      subject: `📈 Application Progress Tracker - #${appNum}`,
      text: `Dear ${userName},\n\nYour loan application progress tracker is active.\n\nApplication Number: #${appNum}\nBank Partner: ${bankName}\nLoan Type: ${loanType}\nCurrent Stage: Application Submitted\nProgress: ${progress}%\n\nYou can track the progress of your application on the VidyaLoan dashboard: ${frontendUrl}/dashboard\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Progress Tracker - VidyaLoan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #6366f1 0%, #4f46e5 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:42px;">📈</p>
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Application Tracking Active
              </h2>
              <p style="color:#e0e7ff;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                Here is the real-time tracking pipeline of your application. You can view the status of each stage below.
              </p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 24px;">
              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 24px;">
                Dear <strong>${userName}</strong>, <br><br>
                Your loan application for <strong>${bankName}</strong> has been registered on the VidyaLoan system. You can follow the complete journey of your application from submission to disbursement here.
              </p>

              <!-- Progress bar container -->
              <div style="background:#f3f4f6; border-radius:10px; height:8px; width:100%; margin:24px 0 12px; overflow:hidden;">
                <div style="background:linear-gradient(to right, #059669, #10b981); height:100%; width:${progress}%; border-radius:10px;"></div>
              </div>
              <p style="color:#4b5563; font-size:12px; font-weight:600; margin:0 0 28px; text-align:right;">
                Overall Progress: ${progress}% completed
              </p>

              <!-- Timeline -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 20px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                📍 Tracking Pipeline
              </h3>
              
              <table cellpadding="0" cellspacing="0" width="100%">
                <!-- Step 1 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Application Submitted</span>
                    <span style="color: #059669; font-size: 11px; font-weight: 600; text-transform: uppercase;">Completed</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Your application has been received and registered under number #${appNum}.</p>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #7c3aed; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">2</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 600; font-size: 14px; display: block;">Document Verification</span>
                    <span style="color: #7c3aed; font-size: 11px; font-weight: 600; text-transform: uppercase;">Next Step</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Verify your identity and upload certificates. Link DigiLocker for instant approval.</p>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">3</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Credit Check</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">System performs background financial and credit score checks.</p>
                  </td>
                </tr>
                <!-- Step 4 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">4</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Bank Review</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Our partner bank will review the details for eligibility.</p>
                  </td>
                </tr>
                <!-- Step 5 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">5</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Sanction</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Official sanction letter is issued with specific loan interest rate & terms.</p>
                  </td>
                </tr>
                <!-- Step 6 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">6</div>
                  </td>
                  <td valign="top" style="padding-left: 12px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Disbursement</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Funds are transferred directly to the educational institution.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="${frontendUrl}/dashboard" style="
                display:inline-block;
                background:linear-gradient(135deg,#6366f1,#4f46e5);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(99,102,241,0.4);
              ">🚀 Go to Tracking Dashboard</a>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Registered Email Address</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">This message was sent to ${email} registered with your account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                You received this email because you registered at VidyaLoan.<br/>
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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
      console.log(`[EmailService] Sending loan tracking email to: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Loan tracking email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – loan tracking email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send loan tracking email to ${email}:`, error);
    }
  }

  async sendApplicationSentToBankEmail(email: string, userName: string, bankName: string, application: any) {
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();
    const appNum = application.applicationNumber || 'N/A';
    const loanType = (application.loanType || 'Education').toUpperCase();
    const progress = 50;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: email,
      subject: `📤 Application Shared with ${bankName} - #${appNum}`,
      text: `Dear ${userName},\n\nYour loan application has been reviewed and processed by the VidyaLoan staff and has been successfully sent to ${bankName} for review.\n\nApplication Number: #${appNum}\nBank Partner: ${bankName}\nLoan Type: ${loanType}\nCurrent Stage: Bank Review\nProgress: ${progress}%\n\nYou can track the progress of your application on the VidyaLoan dashboard: ${frontendUrl}/dashboard\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Submitted to Bank - VidyaLoan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          
          <!-- HEADER -->
         <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #4f46e5 0%, #7c3aed 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:42px;">📤</p>
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Sent to Bank for Review
              </h2>
              <p style="color:#e0e7ff;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                Your application has been processed by our team and forwarded to <strong>${bankName}</strong>.
              </p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 24px;">
              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 24px;">
                Dear <strong>${userName}</strong>, <br><br>
                We are pleased to inform you that your education loan application under number <strong>#${appNum}</strong> has been thoroughly reviewed and verified by the VidyaLoan staff. 
                All document checks have passed, and the verified application bundle has now been sent directly to <strong>${bankName}</strong> for final approval.
              </p>

              <!-- Progress bar container -->
              <div style="background:#f3f4f6; border-radius:10px; height:8px; width:100%; margin:24px 0 12px; overflow:hidden;">
                <div style="background:linear-gradient(to right, #059669, #10b981); height:100%; width:${progress}%; border-radius:10px;"></div>
              </div>
              <p style="color:#4b5563; font-size:12px; font-weight:600; margin:0 0 28px; text-align:right;">
                Overall Progress: ${progress}% completed
              </p>

              <!-- Timeline -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 20px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                📍 Tracking Pipeline
              </h3>
              
              <table cellpadding="0" cellspacing="0" width="100%">
                <!-- Step 1 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Application Submitted</span>
                    <span style="color: #059669; font-size: 11px; font-weight: 600; text-transform: uppercase;">Completed</span>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Document Verification</span>
                    <span style="color: #059669; font-size: 11px; font-weight: 600; text-transform: uppercase;">Completed</span>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Credit Check</span>
                    <span style="color: #059669; font-size: 11px; font-weight: 600; text-transform: uppercase;">Completed</span>
                  </td>
                </tr>
                <!-- Step 4 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #7c3aed; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">4</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Bank Review</span>
                    <span style="color: #7c3aed; font-size: 11px; font-weight: 600; text-transform: uppercase;">Under Bank Review</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">${bankName} is currently evaluating the application and risk profiles.</p>
                  </td>
                </tr>
                <!-- Step 5 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">5</div>
                    <div style="width: 2px; height: 35px; background-color: #e5e7eb; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Sanction Offer</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                  </td>
                </tr>
                <!-- Step 6 -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #f3f4f6; color: #9ca3af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">6</div>
                  </td>
                  <td valign="top" style="padding-left: 12px;">
                    <span style="color: #9ca3af; font-weight: 600; font-size: 14px; display: block;">Disbursement</span>
                    <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase;">Pending</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="${frontendUrl}/dashboard" style="
                display:inline-block;
                background:linear-gradient(135deg,#7c3aed,#4f46e5);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(124,58,237,0.4);
              ">🚀 View Application Status</a>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Registered Email Address</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">This message was sent to ${email} registered with your account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                You received this email because you registered at VidyaLoan.<br/>
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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
      console.log(`[EmailService] Sending application sent to bank email to: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Application sent to bank email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – tracking email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send application sent to bank email to ${email}:`, error);
    }
  }

  async sendApplicationAcceptedByBankEmail(email: string, userName: string, bankName: string, application: any, details?: any) {
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();
    const appNum = application.applicationNumber || 'N/A';
    const progress = 85;

    // Parse sanction amounts and rates
    const rawAmt = details?.sanctionAmount || application.sanctionAmount || application.amount;
    const amount = rawAmt ? `₹${Number(rawAmt).toLocaleString('en-IN')}` : 'N/A';
    const rate = details?.interestRate || application.interestRate || '9.5';
    const tenure = details?.tenure || application.tenure || 120;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: email,
      subject: `🎉 Congratulations! Loan Application Accepted by ${bankName} - #${appNum}`,
      text: `Dear ${userName},\n\nWe have fantastic news! Your loan application for ${bankName} has been accepted and approved by the bank.\n\nApplication Number: #${appNum}\nSanction Amount: ${amount}\nInterest Rate: ${rate}% p.a.\nTenure: ${tenure} months\n\nYou can view and accept the formal sanction letter on your VidyaLoan dashboard: ${frontendUrl}/dashboard\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loan Application Accepted - VidyaLoan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #059669 0%, #10b981 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:42px;">🎉</p>
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Application Approved!
              </h2>
              <p style="color:#d1fae5;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                Great news, ${userName}! Your loan application has been accepted by <strong>${bankName}</strong>.
              </p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 24px;">
              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 24px;">
                Dear <strong>${userName}</strong>, <br><br>
                We are thrilled to let you know that <strong>${bankName}</strong> has accepted and approved your loan application. Below are the details of your sanction proposal:
              </p>

              <!-- Sanction Details Box -->
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px; margin-bottom:28px;">
                <h4 style="color:#166534; font-size:14px; font-weight:700; margin:0 0 12px; text-transform:uppercase; letter-spacing:0.05em;">💰 Approval Details</h4>
                <table style="width:100%; font-size:14px; border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0; color:#166534; font-weight:600;">Sanctioned Amount:</td>
                    <td style="padding:6px 0; color:#14532d; font-weight:800; font-size:17px;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#166534; font-weight:600;">Interest Rate:</td>
                    <td style="padding:6px 0; color:#14532d; font-weight:700;">${rate}% p.a.</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#166534; font-weight:600;">Repayment Tenure:</td>
                    <td style="padding:6px 0; color:#14532d; font-weight:700;">${tenure} months</td>
                  </tr>
                </table>
              </div>

              <!-- Progress bar container -->
              <div style="background:#f3f4f6; border-radius:10px; height:8px; width:100%; margin:24px 0 12px; overflow:hidden;">
                <div style="background:linear-gradient(to right, #059669, #10b981); height:100%; width:${progress}%; border-radius:10px;"></div>
              </div>
              <p style="color:#4b5563; font-size:12px; font-weight:600; margin:0 0 28px; text-align:right;">
                Overall Progress: ${progress}% completed
              </p>

              <!-- Timeline -->
              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 20px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                📍 Tracking Pipeline
              </h3>
              
              <table cellpadding="0" cellspacing="0" width="100%">
                <!-- Step 1-4 completed -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Application Submitted & Verified</span>
                  </td>
                </tr>
                <!-- Step 5 Completed -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">✓</div>
                    <div style="width: 2px; height: 35px; background-color: #059669; margin: 4px auto;"></div>
                  </td>
                  <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                    <span style="color: #111827; font-weight: 700; font-size: 14px; display: block;">Sanction Offer Issued</span>
                    <span style="color: #059669; font-size: 11px; font-weight: 600; text-transform: uppercase;">Completed</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Sanction letter has been generated. Please review terms and confirm.</p>
                  </td>
                </tr>
                <!-- Step 6 disbursement active -->
                <tr>
                  <td valign="top" style="width: 32px; text-align: center;">
                    <div style="background-color: #7c3aed; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; display: inline-block;">6</div>
                  </td>
                  <td valign="top" style="padding-left: 12px;">
                    <span style="color: #111827; font-weight: 600; font-size: 14px; display: block;">Disbursement</span>
                    <span style="color: #7c3aed; font-size: 11px; font-weight: 600; text-transform: uppercase;">Next Step</span>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0; line-height: 1.4;">Accepting the letter will trigger transfer of funds to your university.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="${frontendUrl}/dashboard" style="
                display:inline-block;
                background:linear-gradient(135deg,#10b981,#059669);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(16,185,129,0.4);
              ">🚀 Review & Accept Sanction Letter</a>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Registered Email Address</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">This message was sent to ${email} registered with your account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                You received this email because you registered at VidyaLoan.<br/>
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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
      console.log(`[EmailService] Sending application accepted email to: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Generate the entire application PDF
        const appPdfBuffer = await this.generateApplicationPdf(application).catch(err => {
          console.error('[EmailService] Failed to generate application PDF for sanction email:', err);
          return null;
        });
        
        if (appPdfBuffer) {
          (mailOptions as any).attachments = [
            {
              filename: `Loan_Application_${appNum}.pdf`,
              content: appPdfBuffer,
              contentType: 'application/pdf',
            }
          ];
        }

        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Application accepted email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – tracking email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send application accepted email to ${email}:`, error);
    }
  }

  async sendApplicationRejectedByBankEmail(email: string, userName: string, bankName: string, reason: string) {
    const frontendUrl = 'https://developer.vidyaloans.in';
    const year = new Date().getFullYear();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: email,
      subject: `⚠️ Update on Your Loan Application - Rejected by ${bankName}`,
      text: `Dear ${userName},\n\nWe regret to inform you that your loan application has been rejected by ${bankName}.\n\nRejection Reason: ${reason || 'Credit score or verification shortfall'}\n\nDon't worry! VidyaLoan is partnered with 20+ other lenders. Our team will automatically match your profile with other suitable bank partners to explore alternate options. Contact our loan counsellors immediately for help.\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Rejected - VidyaLoan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #1e1b6e 100%);
              border-radius: 20px 20px 0 0;
              padding: 36px 40px 28px;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left side Logo -->
                  <td width="60" align="left" style="vertical-align: middle;">
                    <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
                  </td>
                  <!-- Middle Text -->
                  <td align="center" style="vertical-align: middle; padding-right: 60px;">
                    <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Inter','Segoe UI',Arial,sans-serif;">VidyaLoan</h1>
                    <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;text-transform:uppercase;">EDUCATION LOAN PLATFORM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="
              background: linear-gradient(160deg, #dc2626 0%, #f43f5e 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:42px;">⚠️</p>
              <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;line-height:1.2;">
                Application Rejected by Bank
              </h2>
              <p style="color:#ffe4e6;margin:0;font-size:15px;line-height:1.65;max-width:420px;display:inline-block;">
                We regret to inform you that <strong>${bankName}</strong> was unable to approve this application.
              </p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 24px;">
              <p style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 24px;">
                Dear <strong>${userName}</strong>, <br><br>
                Thank you for applying through VidyaLoan. We received the decision review from <strong>${bankName}</strong> regarding your loan application.
              </p>

              <!-- Rejection Reason Box -->
              <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:12px; padding:20px; margin-bottom:28px;">
                <h4 style="color:#9f1239; font-size:14px; font-weight:700; margin:0 0 8px; text-transform:uppercase; letter-spacing:0.05em;">Reason for Decision</h4>
                <p style="color:#881337; font-size:14px; margin:0; line-height:1.5;">
                  ${reason || 'Credit profile parameters or documentation criteria were not met for this specific bank scheme.'}
                </p>
              </div>

              <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:28px 0 12px;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">
                💡 Don't lose heart! What's next?
              </h3>
              <p style="color:#4b5563; font-size:14px; line-height:1.6; margin:0 0 20px;">
                A single rejection from one lender does not mean you cannot secure your education loan. 
                VidyaLoan is partnered with <strong>20+ other leading banks and NBFCs</strong>. 
                Our platform will automatically evaluate and match your dossier with other suitable lending partners that fit your profile.
              </p>
              <p style="color:#4b5563; font-size:14px; line-height:1.6; margin:0;">
                Your dedicated loan counsellor is already reviewing alternative options for you and will reach out shortly.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="${frontendUrl}/dashboard" style="
                display:inline-block;
                background:linear-gradient(135deg,#e11d48,#be123c);
                color:#ffffff;
                text-decoration:none;
                padding:16px 44px;
                border-radius:50px;
                font-size:16px;
                font-weight:700;
                letter-spacing:0.3px;
                box-shadow:0 6px 20px rgba(225,29,72,0.4);
              ">💬 Chat with Loan Counsellor</a>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-weight:700;color:#374151;font-size:13px;">Registered Email Address</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">This message was sent to ${email} registered with your account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#1a0533,#1e1b6e);
              border-radius:0 0 20px 20px;
              padding:28px 40px;
              text-align:center;
            ">
              <p style="color:#a78bfa;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">VIDYALOAN</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 12px;line-height:1.6;">
                Empowering Indian students to achieve global education goals.<br/>
                Registered in India | CIN: U65929KA2024PTC000001
              </p>
              <p style="color:#4b5563;font-size:10px;margin:0;line-height:1.6;">
                You received this email because you registered at VidyaLoan.<br/>
                © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br/>
                <a href="${frontendUrl}/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${frontendUrl}/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a>
              </p>
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
      console.log(`[EmailService] Sending application rejected email to: ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Application rejected email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – tracking email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send application rejected email to ${email}:`, error);
    }
  }

  public generateApplicationPdf(application: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Colors
        const primaryColor = '#6605c7'; // Vidya Loan Deep Purple
        const textColor = '#1f2937';
        const lightGray = '#f3f4f6';
        const darkGray = '#4b5563';

        // --- Branded Header ---
        doc.fillColor(primaryColor)
           .fontSize(24)
           .text('Vidya Loan', 50, 50, { characterSpacing: 1 });

        doc.fillColor(darkGray)
           .fontSize(10)
           .text('Education Loan Application Summary', 50, 80);

        doc.moveTo(50, 95).lineTo(550, 95).strokeColor('#e5e7eb').lineWidth(1).stroke();

        // Application Meta Details
        doc.fillColor(textColor).fontSize(10).text(`Application Number: ${application.applicationNumber || 'N/A'}`, 50, 110);
        doc.text(`Applied Bank: ${application.bank || application.bankName || 'N/A'}`, 50, 125);
        doc.text(`Loan Amount: Rs. ${(application.amount || 0).toLocaleString('en-IN')}`, 50, 140);
        doc.text(`Status: ${(application.status || 'pending').toUpperCase()}`, 320, 110);
        doc.text(`Submitted On: ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-IN') : 'N/A'}`, 320, 125);

        doc.moveTo(50, 160).lineTo(550, 160).strokeColor('#e5e7eb').lineWidth(1).stroke();

        let y = 175;

        // Helper to draw sections
        const drawSectionHeader = (title) => {
          if (y > 620) { doc.addPage(); y = 50; }
          doc.fillColor(primaryColor).fontSize(12).text(title, 50, y);
          y += 18;
          doc.moveTo(50, y).lineTo(550, y).strokeColor('#ede9fe').lineWidth(0.5).stroke();
          y += 10;
        };

        const drawField = (label, value, halfWidth = false, rightSide = false) => {
          if (y > 700) { doc.addPage(); y = 50; }
          doc.fillColor(darkGray).fontSize(9).text(label, rightSide ? 300 : 50, y);
          doc.fillColor(textColor).fontSize(10).text(String(value ?? 'N/A'), rightSide ? 380 : 150, y);
          if (!halfWidth || rightSide) {
            y += 16;
          }
        };

        // 1. Personal Details
        drawSectionHeader('1. Personal Details');
        drawField('First Name', application.firstName, true, false);
        drawField('Last Name', application.lastName, true, true);
        drawField('Email ID', application.email, true, false);
        drawField('Phone Number', application.phone, true, true);
        drawField('Date of Birth', application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString('en-IN') : 'N/A', true, false);
        drawField('Gender', application.gender, true, true);
        drawField('Nationality', application.nationality, false, false);
        y += 10;

        // 2. Address
        drawSectionHeader('2. Contact Address');
        drawField('Address', application.address, false, false);
        drawField('City', application.city, true, false);
        drawField('State', application.state, true, true);
        drawField('Pincode', application.pincode, true, false);
        drawField('Country', application.country, true, true);
        y += 10;

        // 3. Academic details
        drawSectionHeader('3. Academic Details');
        drawField('University Name', application.universityName, false, false);
        drawField('Course Name', application.courseName, false, false);
        drawField('Course Duration', application.courseDuration ? `${application.courseDuration} Months` : 'N/A', true, false);
        drawField('Admission Status', application.admissionStatus, true, true);
        y += 10;

        // 4. Employment details
        drawSectionHeader('4. Employment Details');
        drawField('Employment Type', application.employmentType, true, false);
        drawField('Employer Name', application.employerName, true, true);
        drawField('Job Title', application.jobTitle, true, false);
        drawField('Annual Income', application.annualIncome ? `Rs. ${Number(application.annualIncome).toLocaleString('en-IN')}` : 'N/A', true, true);
        y += 10;

        // 5. Co-Applicant
        drawSectionHeader('5. Co-Applicant & Parent Details');
        drawField('Has Co-Applicant', application.hasCoApplicant ? 'Yes' : 'No', true, false);
        if (application.hasCoApplicant) {
          drawField('Name', application.coApplicantName, true, true);
          drawField('Relation', application.coApplicantRelation, true, false);
          drawField('Phone', application.coApplicantPhone, true, true);
          drawField('Income', application.coApplicantIncome ? `Rs. ${Number(application.coApplicantIncome).toLocaleString('en-IN')}` : 'N/A', false, false);
        }
        drawField("Father's Name", application.fatherName, true, false);
        drawField("Mother's Name", application.motherName, true, true);
        y += 10;

        // 6. Collateral
        drawSectionHeader('6. Collateral Details');
        drawField('Has Collateral', application.hasCollateral ? 'Yes' : 'No', true, false);
        if (application.hasCollateral) {
          drawField('Collateral Type', application.collateralType, true, true);
          drawField('Collateral Value', application.collateralValue ? `Rs. ${Number(application.collateralValue).toLocaleString('en-IN')}` : 'N/A', false, false);
          drawField('Collateral Details', application.collateralDetails, false, false);
        }

        // Footer
        doc.fillColor(darkGray)
           .fontSize(8)
           .text('This is a computer-generated summary of your VidyaLoan application.', 50, 740, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
