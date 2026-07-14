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
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to VidyaLoan – ${name}</title>
    <style>
        /* Responsive styles for email clients that support media queries */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .col { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-bottom: 20px; }
            .footer-col { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 15px; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f9fc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                    
                    <tr>
                        <td style="background-color: #1e3a8a; padding: 32px 40px; text-align: left;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">VidyaLoan</h1>
                                        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Education Loan Platform</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 40px 30px 40px;">
                            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">Welcome, ${name}!</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                                Your profile is now complete and your VidyaLoan account is fully activated. Let's turn your education dream into a reality with the smartest loan platform in India. Explore customized loan options, upload documents digitally, and seamlessly compare leading bank offers all in one dashboard.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td align="left">
                                        <a href="${frontendUrl}/dashboard" target="_blank" style="background-color: #2563eb; color: #ffffff; display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">Go to My Dashboard →</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <fieldset style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
                                <legend style="color: #1e3a8a; font-size: 14px; font-weight: 700; padding: 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">What VidyaLoan Offers You</legend>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td class="col" width="50%" valign="top" style="padding-right: 12px;">
                                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">💰 Loans up to ₹1.5 Crore</p>
                                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 18px;">Covers tuition, living, travel, laptop & exam fees.</p>
                                            
                                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">⏳ Study-Period Moratorium</p>
                                            <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 18px;">No EMI during studies + 6 months after graduation.</p>
                                        </td>
                                        <td class="col" width="50%" valign="top" style="padding-left: 12px;">
                                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">📉 From 8.5% p.a. Interest</p>
                                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 18px;">Competitive rates compared across 20+ banks & NBFCs.</p>
                                            
                                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">🔓 No Collateral up to ₹7.5L</p>
                                            <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 18px;">Unsecured loan options built for eligible students.</p>
                                        </td>
                                    </tr>
                                </table>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 700;">Your 4-Step Loan Journey</h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="top" width="40" style="padding-bottom: 16px;">
                                        <div style="background-color: #dcfce7; color: #15803d; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">✓</div>
                                    </td>
                                    <td valign="top" style="padding-bottom: 16px;">
                                        <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 600; color: #111827;">Complete Your Profile</p>
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">You've already done this — your details are saved securely.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top" width="40" style="padding-bottom: 16px;">
                                        <div style="background-color: #eff6ff; color: #2563eb; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">2</div>
                                    </td>
                                    <td valign="top" style="padding-bottom: 16px;">
                                        <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 600; color: #111827;">Upload Documents via DigiLocker</p>
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Sync Aadhaar, academic transcripts, and your admission letter instantly.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top" width="40" style="padding-bottom: 16px;">
                                        <div style="background-color: #eff6ff; color: #2563eb; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">3</div>
                                    </td>
                                    <td valign="top" style="padding-bottom: 16px;">
                                        <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 600; color: #111827;">Choose Your Bank & Plan</p>
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Our engine evaluates plans across SBI, HDFC, Axis, and 15+ lenders.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top" width="40;">
                                        <div style="background-color: #eff6ff; color: #2563eb; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">4</div>
                                    </td>
                                    <td valign="top">
                                        <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 600; color: #111827;">Track Metrics in Real Time</p>
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Access milestones, download sanctions, or connect with your personal counsellor.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 20px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="font-size: 13px; color: #4b5563; font-weight: 600;">🏦 20+ Partner Lenders</td>
                                    <td align="center" style="font-size: 13px; color: #4b5563; font-weight: 600;">⚡ 48-Hour Avg Approval</td>
                                    <td align="center" style="font-size: 13px; color: #4b5563; font-weight: 600;">🌍 50+ Global Destinations</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 40px; background-color: #ffffff; font-size: 14px; color: #4b5563;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td class="footer-col" width="70%" style="line-height: 20px;">
                                        <strong>Need guidance getting started?</strong><br>
                                        Our expert financial advisors are available Mon–Sat, 9 AM – 6 PM IST to assist you with applications.
                                    </td>
                                    <td class="footer-col" width="30%" align="right" valign="middle">
                                        <a href="mailto:support@vidyaloan.com" style="color: #2563eb; text-decoration: none; font-weight: 600; border: 1px solid #2563eb; padding: 8px 16px; border-radius: 4px; display: inline-block;">Contact Support</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f1f5f9; padding: 24px 40px; text-align: center; font-size: 12px; color: #64748b; line-height: 18px;">
                            <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">© ${year} VIDYALOAN TECHNOLOGIES PVT. LTD.</p>
                            <p style="margin: 0 0 16px 0;">Empowering Indian students to achieve global education goals.<br>Registered in India | CIN: U65929KA2024PTC000001</p>
                            <p style="margin: 0;"> You received this automated notification because your email was registered on VidyaLoan. <br> <a href="${frontendUrl}/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a> &middot; <a href="${frontendUrl}/terms" style="color: #64748b; text-decoration: underline;">Terms of Service</a></p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>`,
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
                    <img src="http://localhost:3000/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;border-radius:10px;" />
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
  <title>Loan Application Submitted Successfully</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .col-3 { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 20px; }
      .footer-col { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 15px; }
      .meta-table td { display: block !important; width: 100% !important; text-align: left !important; padding: 8px 0 !important; }
      .meta-table tr { border-bottom: 1px solid #f1f5f9; display: block; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 45px 0;">
    <tr>
      <td align="center">
        <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 28px 40px; text-align: left;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="color: #38bdf8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 4px;">VidyaLoan</span>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Application Received</h1>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.3);">#${appNum}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: left;">
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 15px; color: #166534; font-weight: 600; line-height: 22px;">
                  🎉 Great job! Your financing request has been successfully logged and is currently under review by our credit specialists.
                </p>
              </div>
              <p style="color: #475569; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
                Hello ${userName || 'Applicant'}, Thank you for choosing VidyaLoan to fund your career aspirations. We have safely compiled your credentials for <strong>${bankName}</strong>. Expect a definitive profile eligibility status update within the next <strong>24–48 hours</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table class="meta-table" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <tr>
                  <td colspan="2" style="padding-bottom: 14px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">📋 Application Summary</h3>
                  </td>
                </tr>
                <tr>
                  <td width="40%" style="padding: 12px 0 6px 0; font-size: 14px; color: #64748b;">Bank Partner</td>
                  <td width="60%" style="padding: 12px 0 6px 0; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">${bankName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Loan Type</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">${loanType}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Requested Amount</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #10b981; font-weight: 700; text-align: right;">${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Institution</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">${university}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0 4px 0; font-size: 14px; color: #64748b;">Target Degree</td>
                  <td style="padding: 6px 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">${course}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 35px 40px;">
              <h4 style="margin: 0 0 20px 0; font-size: 16px; color: #0f172a; font-weight: 700;">⚡ Next Operational Steps</h4>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" width="36" style="padding-bottom: 20px;">
                    <div style="background-color: #e0f2fe; color: #0284c7; width: 24px; height: 24px; border-radius: 6px; text-align: center; line-height: 24px; font-weight: 700; font-size: 12px;">1</div>
                  </td>
                  <td valign="top" style="padding-bottom: 20px;">
                    <h5 style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 600;">Document Syncing</h5>
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 18px;">Accelerate your file review. Link your DigiLocker profile to seamlessly pull verified identity details and certificates directly into the verification system.</p>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="36" style="padding-bottom: 20px;">
                    <div style="background-color: #f1f5f9; color: #475569; width: 24px; height: 24px; border-radius: 6px; text-align: center; line-height: 24px; font-weight: 700; font-size: 12px;">2</div>
                  </td>
                  <td valign="top" style="padding-bottom: 20px;">
                    <h5 style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 600;">Credit Check & Evaluation</h5>
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 18px;">Our assigned financial auditors and bank underwriters evaluate academic eligibility parameters along with financial co-applicant portfolios.</p>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="36;">
                    <div style="background-color: #f1f5f9; color: #475569; width: 24px; height: 24px; border-radius: 6px; text-align: center; line-height: 24px; font-weight: 700; font-size: 12px;">3</div>
                  </td>
                  <td valign="top">
                    <h5 style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 600;">Sanction Letter Delivery</h5>
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 18px;">Upon successful validation clearance, your digitally signed bank sanction document outlines the exact interest structures and remittance methods.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 40px 40px 40px; border-bottom: 1px solid #f1f5f9;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/dashboard" target="_blank" style="background-color: #0284c7; color: #ffffff; display: block; padding: 14px 0; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; text-align: center; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);">🚀 Track Real-Time Application Status</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="footer-col" width="65%">
                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">Need any processing assistance?</p>
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 18px;">Our assigned loan counsellors are configured to walk you through documentation guidelines.</p>
                  </td>
                  <td class="footer-col" width="35%" align="right" valign="middle">
                    <a href="mailto:support@vidyaloan.com" style="color: #0284c7; text-decoration: none; font-size: 13px; font-weight: 600; border: 1px solid #e2e8f0; background-color: #ffffff; padding: 10px 16px; border-radius: 6px; display: inline-block;">📧 Contact Support</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #0f172a; padding: 30px 40px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 20px;">
              <strong style="color: #ffffff; letter-spacing: 0.5px;">VIDYALOAN TECHNOLOGIES</strong><br>
              Empowering Indian students to achieve global education goals seamlessly.<br>
              <span style="color: #64748b; font-size: 11px;">Registered in India · CIN: U65929KA2024PTC000001</span>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 1px solid #1e293b; padding-top: 16px;">
                <tr>
                  <td align="center" style="font-size: 11px; color: #64748b;">
                    You received this mail response because you registered at VidyaLoan. <br>
                    <a href="${frontendUrl}/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a> · <a href="${frontendUrl}/terms" style="color: #94a3b8; text-decoration: underline;">Terms of Service</a>
                  </td>
                </tr>
              </table>
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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Progress Tracker</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .footer-col { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 15px; }
            .progress-bar-container { width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 45px 0;">
        <tr>
            <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
                    
                    <tr>
                        <td style="background-color: #4f46e5; padding: 32px 40px; text-align: left; background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 6px;">VidyaLoan Engine</span>
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Application Progress Active</h1>
                                    </td>
                                    <td align="right" valign="middle">
                                        <div style="background-color: rgba(255, 255, 255, 0.15); color: #ffffff; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px; backdrop-filter: blur(4px);">
                                            ID: #${appNum}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 40px 24px 40px;">
                            <p style="color: #475569; font-size: 15px; line-height: 24px; margin: 0;">
                                Your loan application for <strong>${bankName}</strong> has been safely registered on the VidyaLoan system. You can closely monitor the real-time pipeline status of your journey from submission through to final fund disbursement.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px;">
                                <tr>
                                    <td style="font-size: 14px; color: #1e293b; font-weight: 600;">Overall Progress</td>
                                    <td align="right" style="font-size: 14px; color: #4f46e5; font-weight: 700;">${progress}% Completed</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding-top: 12px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #e2e8f0; border-radius: 4px; height: 8px;">
                                            <tr>
                                                <td width="${progress}%" style="background-color: #10b981; border-radius: 4px; height: 8px;"></td>
                                                <td width="${100 - progress}%"></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 35px 40px;">
                            <h3 style="margin: 0 0 24px 0; font-size: 16px; color: #0f172a; font-weight: 700; letter-spacing: -0.3px;">📍 Live Tracking Pipeline</h3>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="top" width="32" style="padding-bottom: 24px; text-align: center;">
                                        <div style="background-color: #dcfce7; color: #15803d; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 700; font-size: 12px;">✓</div>
                                        <div style="width: 2px; height: 36px; background-color: #10b981; margin: 4px auto 0 auto;"></div>
                                    </td>
                                    <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                                        <span style="background-color: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 4px;">Completed</span>
                                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Application Submitted</h4>
                                        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 18px;">Your application parameters have been logged and registered securely under ticket ID #${appNum}.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td valign="top" width="32" style="padding-bottom: 24px; text-align: center;">
                                        <div style="background-color: #e0f2fe; color: #0369a1; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 700; font-size: 12px; border: 2px solid #0284c7; box-sizing: border-box;">2</div>
                                        <div style="width: 2px; height: 36px; background-color: #e2e8f0; margin: 4px auto 0 auto;"></div>
                                    </td>
                                    <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                                        <span style="background-color: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 4px;">Next Action Step</span>
                                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Document Verification</h4>
                                        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 18px;">Verify your identity metrics and secure profile credentials. Link your DigiLocker module to process instant auto-approvals.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td valign="top" width="32" style="padding-bottom: 24px; text-align: center;">
                                        <div style="background-color: #f1f5f9; color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 12px;">3</div>
                                        <div style="width: 2px; height: 36px; background-color: #e2e8f0; margin: 4px auto 0 auto;"></div>
                                    </td>
                                    <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                                        <span style="background-color: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 4px;">Pending</span>
                                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #475569; font-weight: 600;">Credit Check Evaluation</h4>
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 18px;">Automated processes calculate financial risk profiles and verify credit scores internally.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td valign="top" width="32" style="padding-bottom: 24px; text-align: center;">
                                        <div style="background-color: #f1f5f9; color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 12px;">4</div>
                                        <div style="width: 2px; height: 36px; background-color: #e2e8f0; margin: 4px auto 0 auto;"></div>
                                    </td>
                                    <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                                        <span style="background-color: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 4px;">Pending</span>
                                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #475569; font-weight: 600;">Partner Bank Review</h4>
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 18px;">Underwriters from our partner bank evaluate files for formal eligibility compliance parameters.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td valign="top" width="32" style="padding-bottom: 24px; text-align: center;">
                                        <div style="background-color: #f1f5f9; color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 12px;">5</div>
                                        <div style="width: 2px; height: 36px; background-color: #e2e8f0; margin: 4px auto 0 auto;"></div>
                                    </td>
                                    <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                                        <span style="background-color: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 4px;">Pending</span>
                                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #475569; font-weight: 600;">Sanction Release</h4>
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 18px;">Official digital generation of loan sanction letter detailing specific rate frameworks.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td valign="top" width="32" style="text-align: center;">
                                        <div style="background-color: #f1f5f9; color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 12px;">6</div>
                                    </td>
                                    <td valign="top" style="padding-left: 12px;">
                                        <span style="background-color: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 4px;">Pending</span>
                                        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #475569; font-weight: 600;">Loan Disbursement</h4>
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 18px;">Capital structures are dispatched directly to your designated global academic institution.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px; border-bottom: 1px solid #f1f5f9;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${frontendUrl}/dashboard" target="_blank" style="background-color: #4f46e5; color: #ffffff; display: block; padding: 14px 0; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">🚀 Launch Real-Time Tracking Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #fafafa; padding: 24px 40px; border-bottom: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="font-size: 12px; color: #64748b; line-height: 18px;">
                                        <strong>Registered Inbox Address:</strong><br>
                                        This verification notice was auto-dispatched to the registered user profile matching your credentials. Keep track safely via your centralized dashboard.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #0f172a; padding: 32px 40px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 20px;">
                            <strong style="color: #ffffff; letter-spacing: 0.5px;">VIDYALOAN PLATFORMS</strong><br>
                            Empowering enterprise academic financing with transparent operational transparency global frameworks.<br>
                            <span style="color: #64748b; font-size: 11px;">Registered · CIN: U65929KA2024PTC000001</span>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 1px solid #1e293b; padding-top: 16px;">
                                <tr>
                                    <td align="center" style="font-size: 11px; color: #475569;">
                                        © ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.<br>
                                        <a href="${frontendUrl}/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a> &nbsp;·&nbsp; <a href="${frontendUrl}/terms" style="color: #94a3b8; text-decoration: underline;">Terms of Service</a>
                                    </td>
                                </tr>
                            </table>
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

  async sendNewApplicationNotificationToBank(
    bankEmail: string,
    bankName: string,
    application: any,
    studentName: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const appNum = application.applicationNumber || 'N/A';
    const loanType = application.loanType || 'Education Loan';
    const amount = application.amount ? `₹${Number(application.amount).toLocaleString('en-IN')}` : 'N/A';
    const university = application.universityName || 'N/A';
    const course = application.courseType || 'N/A';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: bankEmail,
      subject: `📥 New Education Loan Application Submitted for Review - #${appNum}`,
      text: `Dear Partner at ${bankName},\n\nA new education loan application has been forwarded to you for credit review.\n\nApplication Reference: #${appNum}\nStudent Name: ${studentName}\nRequested Amount: ${amount}\nTarget University: ${university}\nCourse: ${course}\n\nPlease log in to the VidyaLoans Bank Partner Portal to review the credit file and documents.\n\nPortal Login: ${frontendUrl}/bank/login\n\nBest regards,\nThe VidyaLoans Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Loan Application Routed - VidyaLoan</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#334155;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">VidyaLoan</h1>
      <p style="margin:5px 0 0;font-size:12px;opacity:0.9;text-transform:uppercase;letter-spacing:1px;">Bank Partner Portal</p>
    </div>
    <div style="padding:30px;line-height:1.6;">
      <h2 style="margin:0 0 15px;font-size:18px;color:#1e293b;font-weight:700;">New Loan Application for Review</h2>
      <p style="margin:0 0 20px;">Dear Partner at <strong>${bankName}</strong>,</p>
      <p style="margin:0 0 25px;">A new verified student education loan application has been routed to your branch for review. Below are the primary file details:</p>
      
      <div style="background-color:#f1f5f9;border-radius:12px;padding:20px;margin:0 0 25px;">
        <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;width:150px;">Application No.</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:700;">#${appNum}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Student Name</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:600;">${studentName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Loan Amount</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:600;">${amount}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">University</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:600;">${university}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Course</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:600;">${course}</td>
          </tr>
        </table>
      </div>
      
      <p style="margin:0 0 30px;">All applicant documents, co-applicant profiles, and KYC logs have been verified and are available on the bank dashboard.</p>
      
      <div style="text-align:center;margin-bottom:30px;">
        <a href="${frontendUrl}/bank/login" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:700;font-size:14px;box-shadow:0 4px 10px rgba(79,70,229,0.2);">
          Open Partner Portal
        </a>
      </div>
      
      <p style="margin:0;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:20px;">
        This is an automated notification. For assistance, contact support@vidyaloan.com.
      </p>
    </div>
  </div>
</body>
</html>
      `,
    };

    try {
      console.log(`[EmailService] Sending application alert to bank email: ${bankEmail}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] New application email sent successfully to bank: ${bankEmail}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – logged bank notification to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send bank application notification to ${bankEmail}:`, error);
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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Application Accepted - VidyaLoan</title>
    <style>
        /* Reset styles for consistency across email clients */
        body, table, td, a { text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

        /* Premium Hover Effects (Supported by modern clients) */
        .cta-button:hover { background-color: #5b21b6 !important; transform: translateY(-1px); }
    </style>
</head>
<body>
  <div style="
    background-image: url('${frontendUrl}/images/vidyaloans-logo-transparent.png'); 
    background-repeat: no-repeat; 
    background-position: center center; 
    background-size: 50% auto;
    width: 100%; 
    margin: 0; 
    padding: 0;
  ">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(248, 250, 252, 0.9); padding: 40px 10px;">
        <tr>
            <td align="center" valign="top">
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <span style="font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #6605c7; text-transform: uppercase;">VIDYALOAN</span>
                        </td>
                    </tr>

                    <tr>
                        <td align="left" style="padding: 20px 40px 40px 40px; position: relative; background-image: repeating-linear-gradient(-45deg, rgba(102, 5, 199, 0.03) 0px, rgba(102, 5, 199, 0.03) 2px, transparent 2px, transparent 40px);">
                            
                            <h1 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 700; line-height: 1.3; color: #0F172A; text-align: center;">
                                Loan Application Approved!
                            </h1>

                            <div style="height: 1px; width: 60px; background-color: #E2E8F0; margin: 0 auto 30px auto;"></div>

                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                                Hello ${userName},
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                                We have fantastic news! Your loan application for <strong>${bankName}</strong> has been accepted and approved by the bank. Below are the details of your sanction proposal:
                            </p>

                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 16px; font-size: 14px; color: #64748B; font-weight: 500; border-bottom: 1px solid #E2E8F0;">Application Number:</td>
                                    <td style="padding: 16px; font-size: 14px; color: #0F172A; font-weight: 600; text-align: right; border-bottom: 1px solid #E2E8F0;">#${appNum}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px; font-size: 14px; color: #64748B; font-weight: 500; border-bottom: 1px solid #E2E8F0;">Sanctioned Amount:</td>
                                    <td style="padding: 16px; font-size: 14px; color: #0F172A; font-weight: 600; text-align: right; border-bottom: 1px solid #E2E8F0;">${amount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px; font-size: 14px; color: #64748B; font-weight: 500; border-bottom: 1px solid #E2E8F0;">Interest Rate:</td>
                                    <td style="padding: 16px; font-size: 14px; color: #0F172A; font-weight: 600; text-align: right; border-bottom: 1px solid #E2E8F0;">${rate}% p.a.</td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px; font-size: 14px; color: #64748B; font-weight: 500;">Repayment Tenure:</td>
                                    <td style="padding: 16px; font-size: 14px; color: #0F172A; font-weight: 600; text-align: right;">${tenure} months</td>
                                </tr>
                            </table>

                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-top: 10px;">
                                        <a href="${frontendUrl}/dashboard" target="_blank" class="cta-button" style="display: inline-block; background-color: #6605c7; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(102, 5, 199, 0.2); transition: all 0.2s ease;">
                                            Review & Accept Sanction Letter
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color: #F1F5F9; padding: 24px 40px; border-top: 1px solid #E2E8F0;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #94A3B8; line-height: 1.4;">
                                Empowering Indian students to achieve global education goals.<br/>
                                Registered in India | CIN: U65929KA2024PTC000001
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                                &copy; ${year} VidyaLoan Technologies Pvt. Ltd. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
        </tr>
    </table>
  </div>
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

  async sendApplicationRejectedByStaffEmail(email: string, userName: string, reason: string) {
    const year = new Date().getFullYear();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"VidyaLoan" <noreply@vidyaloan.com>',
      to: email,
      subject: `⚠️ Application Rejected by VidyaLoan Staff`,
      text: `Dear ${userName},\n\nWe regret to inform you that your loan application has been rejected by VidyaLoan staff.\n\nRejection Reason: ${reason || 'Not specified'}\n\nIf you have any questions or believe this was a mistake, please contact our support desk immediately.\n\nWarm regards,\nThe VidyaLoan Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Rejected by VidyaLoan Staff</title>
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
              border-bottom: 1px solid rgba(225,29,72,0.3);
              text-align: center;
            ">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px;">VIDYALOAN</span>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#151526;border-radius:0 0 20px 20px;padding:40px;border:1px solid #272742;border-top:none;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;letter-spacing:-0.5px;">Application Rejected by VidyaLoan Staff</h2>
                  </td>
                </tr>
                <tr>
                  <td style="color:#a5a5c7;font-size:15px;line-height:24px;padding-bottom:20px;">
                    Dear <strong>${userName}</strong>,
                  </td>
                </tr>
                <tr>
                  <td style="color:#a5a5c7;font-size:15px;line-height:24px;padding-bottom:24px;">
                    We regret to inform you that after careful review of your documents and profile details, your loan application has been rejected by our <strong>VidyaLoan Verification Staff</strong>.
                  </td>
                </tr>
                
                <!-- REJECTION BOX -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <div style="background-color:rgba(225,29,72,0.06);border:1px solid rgba(225,29,72,0.3);border-left:4px solid #e11d48;border-radius:8px;padding:20px;">
                      <h4 style="color:#e11d48;font-size:11px;font-weight:800;text-transform:uppercase;margin:0 0 8px 0;letter-spacing:1px;">Reason for Rejection</h4>
                      <p style="color:#ffffff;font-size:14px;line-height:20px;font-weight:600;margin:0;font-style:italic;">
                        "${reason || 'Verification shortfall or incomplete criteria'}"
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="color:#a5a5c7;font-size:14px;line-height:22px;padding-bottom:24px;">
                    If you believe this was a mistake, or if you can provide additional/updated documents to resolve the issue, please contact our support desk or reach out to your assigned agent. We will be happy to assist you.
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="border-top:1px solid #272742;padding-top:24px;text-align:center;color:#6b7280;font-size:12px;line-height:18px;">
                    This is an automated notification. Please do not reply directly to this email.<br/>
                    &copy; ${year} VidyaLoan. All rights reserved.
                  </td>
                </tr>
              </table>
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
      console.log(`[EmailService] Sending application rejected by staff email to ${email}`);
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Staff rejection email sent successfully to ${email}`);
      } else {
        console.log(`[EmailService] Email credentials not configured – rejection email logged to console`);
      }
    } catch (error) {
      console.error(`[EmailService] Failed to send staff rejection email to ${email}:`, error);
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

        const drawWatermark = () => {
          doc.save();
          doc.opacity(0.04);
          doc.fillColor(primaryColor);
          doc.fontSize(70);
          doc.translate(doc.page.width / 2, doc.page.height / 2);
          doc.rotate(-30);
          doc.text('VIDYALOAN', -200, -35, { align: 'center', width: 400 });
          doc.restore();
        };

        // Draw on the first page and register for subsequent pages
        drawWatermark();
        doc.on('pageAdded', () => {
          drawWatermark();
        });

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
