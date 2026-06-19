const { EmailService } = require('../dist/auth/email.service');
const { Client } = require('pg');
require('dotenv').config();

async function sendCustomTrackerEmail() {
  console.log('Connecting to database...');
  const pgClient = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await pgClient.connect();

  console.log('Querying application details for VL-APP-2026-00017...');
  const result = await pgClient.query(`
    SELECT la.*, u."firstName" as u_first, u."lastName" as u_last, u.email as u_email
    FROM "LoanApplication" la
    LEFT JOIN "User" u ON la."userId" = u.id
    WHERE la."applicationNumber" = 'VL-APP-2026-00017'
  `);

  if (result.rows.length === 0) {
    console.error('Application VL-APP-2026-00017 not found!');
    await pgClient.end();
    return;
  }

  const app = result.rows[0];
  const email = app.u_email || app.email;
  const userName = `${app.u_first || ''} ${app.u_last || ''}`.trim() || 'Valued Customer';
  const appNum = app.applicationNumber;
  const bankName = app.bank || 'HDFC Credila';
  const loanType = (app.loanType || 'Education').toUpperCase();
  const amount = app.amount ? `₹${Number(app.amount).toLocaleString('en-IN')}` : 'N/A';
  const progress = app.progress || 15;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const year = new Date().getFullYear();

  console.log(`Found application. Sending email to ${email} for user ${userName}...`);

  const emailService = new EmailService();

  const subject = `📈 Application Progress Tracker - #${appNum}`;
  const text = `Dear ${userName},\n\nYour application is being processed by the VidyaLoan team. Our team will verify the application and check the progress of the application.\n\nApplication Details:\n- Number: #${appNum}\n- Partner Bank: ${bankName}\n- Loan Category: ${loanType}\n- Requested Principal: ${amount}\n\nYou can track the live progress of your application on the VidyaLoan dashboard:\n${frontendUrl}/dashboard\n\nWarm regards,\nThe VidyaLoan Team`;

  const html = `
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
              text-align: center;
              border-bottom: 1px solid rgba(139,92,246,0.3);
            ">
              <div style="display:inline-block;width:52px;height:52px;margin-bottom:14px;vertical-align:middle;">
                <img src="${frontendUrl}/images/vidyaloans-logo-transparent.png" alt="VidyaLoan" width="52" height="52" style="display:block;border:none;" onerror="this.style.display='none'" />
              </div>
              <h1 style="color:#ffffff;margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-0.5px;">VidyaLoan</h1>
              <p style="color:#a78bfa;margin:0;font-size:12px;letter-spacing:2px;font-weight:600;">EDUCATION LOAN PLATFORM</p>
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
                Your application is being processed by the <strong>VidyaLoan team</strong>. Our team will verify the application and check the progress of the application to match you with the best loan structures for <strong>${bankName}</strong>.
              </p>

              <!-- Progress bar container -->
              <div style="background:#f3f4f6; border-radius:10px; height:8px; width:100%; margin:24px 0 12px; overflow:hidden;">
                <div style="background:linear-gradient(to right, #059669, #10b981); height:100%; width:${progress}%; border-radius:10px;"></div>
              </div>
              <p style="color:#4b5563; font-size:12px; font-weight:600; margin:0 0 28px; text-align:right;">
                Overall Progress: ${progress}% completed
              </p>

              <!-- Application Summary -->
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
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6366f1;font-weight:700;font-size:14px;">${amount}</td>
                </tr>
              </table>

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
                    <span style="color: #7c3aed; font-size: 11px; font-weight: 600; text-transform: uppercase;">In Progress</span>
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
              ">🚀 Track Live Progress Dashboard</a>
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
  `;

  console.log('Sending email...');
  await emailService.sendMail(email, subject, html, text);
  console.log('Email sent successfully!');

  await pgClient.end();
}

sendCustomTrackerEmail().catch(err => {
  console.error('Failed to send custom tracker email:', err);
});
