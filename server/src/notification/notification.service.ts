import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../auth/email.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create and store a new notification, then broadcast it via WebSocket events.
   */
  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    metadata?: any,
  ) {
    this.logger.log(`Creating notification of type ${type} for User ID ${userId}: ${title}`);

    const newNotif = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId,
      title,
      body,
      type,
      isRead: false,
      timestamp: new Date().toISOString(),
      metadata: metadata || null,
    };

    const { data, error } = await this.db
      .from('Notification')
      .insert(newNotif)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to store notification in DB: ${error.message}`);
      // Fallback: still broadcast it even if DB fails so that real-time is alive
    }

    const payload = data || newNotif;

    // Emitting via EventEmitter2 so ChatGateway receives it and broadcasts via Socket.io
    this.eventEmitter.emit('notification.created', {
      ...payload,
      metadata,
    });

    return payload;
  }

  /**
   * Fetch paginated & filterable notifications for the logged-in user.
   */
  async getNotificationsForUser(
    user: any,
    type?: string,
    limit: number = 30,
    offset: number = 0,
  ) {
    const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin' || user.role === 'super_admin';
    const isBank = user.role === 'bank' || user.role === 'partner_bank';
    const userId = user.id || user.uid || user._id;

    let query = this.db.from('Notification').select('*', { count: 'exact' });

    // Design: staff and admin see system-wide and staff notifications.
    // Bank partners see 'bank' / 'incoming_file' notifications.
    // Students see their own personal notifications.
    if (isStaffOrAdmin) {
      query = query.or(`userId.eq.staff,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
    } else if (isBank) {
      query = query.or(`userId.eq.bank,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
    } else {
      query = query.or(`userId.eq.${userId},userId.eq.all`);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    query = query.eq('isRead', false);

    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`);
      return { items: [], total: 0 };
    }

    return {
      items: data || [],
      total: count || (data || []).length,
    };
  }

  /**
   * Mark a single notification as read (actually delete it).
   */
  async markAsRead(notificationId: string, user: any) {
    const { data, error } = await this.db
      .from('Notification')
      .delete()
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Mark all notifications as read for the user's role or user ID (actually delete them).
   */
  async markAllAsRead(user: any) {
    const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin' || user.role === 'super_admin';
    const isBank = user.role === 'bank' || user.role === 'partner_bank';
    const userId = user.id || user.uid || user._id;

    let query = this.db.from('Notification').delete();

    if (isStaffOrAdmin) {
      query = query.or(`userId.eq.staff,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
    } else if (isBank) {
      query = query.or(`userId.eq.bank,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
    } else {
      query = query.or(`userId.eq.${userId},userId.eq.all`);
    }

    const { data, error } = await query.eq('isRead', false).select();

    if (error) {
      this.logger.error(`Failed to delete all notifications: ${error.message}`);
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  }

  /**
   * Event listener for candidate registration
   * Creates a notification for staff to notify about new candidate
   */
  @OnEvent('candidate.registered')
  async handleCandidateRegistered(payload: any) {
    try {
      const candidateName = payload.firstName || 'New Candidate';
      await this.createNotification(
        'staff',
        `🎉 New Candidate Registered: ${candidateName}`,
        `${candidateName} has registered on Vidyaloan. Email: ${payload.email}`,
        'candidate_registered',
        {
          userId: payload.userId,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          dateOfBirth: payload.dateOfBirth,
          registeredAt: payload.createdAt
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle candidate registration event: ${error.message}`);
    }
  }

  /**
   * Event listener for application creation
   * Creates a notification for staff about new application
   */
  @OnEvent('application.created')
  async handleApplicationCreated(payload: any) {
    try {
      const candidateName = payload.candidateName || 'Candidate';
      await this.createNotification(
        'staff',
        `📋 New Application Created: ${candidateName}`,
        `${candidateName} created a new loan application (${payload.loanType}) for ${payload.bank || 'a bank'}. Application #${payload.applicationNumber}`,
        'application_created',
        {
          applicationId: payload.applicationId,
          applicationNumber: payload.applicationNumber,
          userId: payload.userId,
          candidateName: payload.candidateName,
          candidateEmail: payload.candidateEmail,
          bank: payload.bank,
          loanAmount: payload.loanAmount,
          loanType: payload.loanType,
          createdAt: payload.createdAt
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle application created event: ${error.message}`);
    }
  }

  /**
   * Event listener for application submission
   * Creates a notification for staff about submitted application
   */
  @OnEvent('application.submitted')
  async handleApplicationSubmitted(payload: any) {
    try {
      const candidateName = payload.candidateName || 'Candidate';
      await this.createNotification(
        'staff',
        `🚀 Application Submitted: ${candidateName}`,
        `${candidateName} submitted a loan application for ${payload.bank || 'a bank'}. Application #${payload.applicationNumber}`,
        'application_submitted',
        {
          applicationId: payload.applicationId,
          applicationNumber: payload.applicationNumber,
          userId: payload.userId,
          candidateName: payload.candidateName,
          candidateEmail: payload.candidateEmail,
          bank: payload.bank,
          loanAmount: payload.loanAmount,
          loanType: payload.loanType,
          submittedAt: payload.submittedAt
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle application submitted event: ${error.message}`);
    }
  }

  /**
   * Event listener for document upload
   * Creates a notification for staff about document uploads
   */
  @OnEvent('document.uploaded')
  async handleDocumentUploaded(payload: any) {
    try {
      const candidateName = payload.candidateName || 'Candidate';
      const docName = payload.documentName || payload.documentType;
      await this.createNotification(
        'staff',
        `📄 Document Uploaded: ${docName}`,
        `${candidateName} has uploaded ${docName} for application #${payload.applicationNumber}. Status: ${payload.status}`,
        'document_uploaded',
        {
          applicationId: payload.applicationId,
          applicationNumber: payload.applicationNumber,
          userId: payload.userId,
          candidateName: payload.candidateName,
          candidateEmail: payload.candidateEmail,
          documentType: payload.documentType,
          documentName: payload.documentName,
          status: payload.status,
          createdAt: payload.createdAt
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle document uploaded event: ${error.message}`);
    }
  }

  /**
   * Event listener for document rejection
   * Creates a notification for the student about document rejection
   */
  @OnEvent('document.rejected')
  async handleDocumentRejected(payload: any) {
    try {
      const docName = payload.documentName || payload.documentType;
      await this.createNotification(
        payload.userId,
        `❌ Document Rejected: ${docName}`,
        `Your uploaded ${docName} has been rejected. Reason: ${payload.rejectionReason}`,
        'document_rejected',
        {
          documentId: payload.documentId,
          documentType: payload.documentType,
          documentName: payload.documentName,
          rejectionReason: payload.rejectionReason,
          rejectedAt: payload.rejectedAt,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle document rejected event: ${error.message}`);
    }
  }

  /**
   * Event listener for document acceptance/verification
   * Creates a notification for the student about document approval
   */
  @OnEvent('document.verified')
  async handleDocumentVerified(payload: any) {
    try {
      const docName = payload.documentName || payload.documentType;
      await this.createNotification(
        payload.userId,
        `✅ Document Approved: ${docName}`,
        `Your uploaded ${docName} has been successfully verified.`,
        'document_verified',
        {
          documentId: payload.documentId,
          documentType: payload.documentType,
          documentName: payload.documentName,
          verifiedAt: payload.verifiedAt,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle document verified event: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BANK-SPECIFIC REAL-TIME NOTIFICATIONS
  // These notifications are sent to userId='bank' so the
  // ChatGateway broadcasts them to the room_bank Socket.io room.
  // ─────────────────────────────────────────────────────────────

  /**
   * Notify bank when a new application file is submitted to them
   */
  @OnEvent('bank.submission.created')
  async handleBankSubmissionCreated(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `📥 New Application Received`,
        `A new loan application has been submitted to ${payload.bankName || 'your bank'}. Application ID: ${payload.applicationId || 'N/A'}`,
        'bank_application_received',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
          bankId: payload.bankId,
          bankName: payload.bankName,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank submission event: ${error.message}`);
    }
  }

  /**
   * Notify bank when staff logs a file with LAN
   */
  @OnEvent('bank.file.logged')
  async handleBankFileLogged(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `🗂️ File Logged: LAN ${payload.lanNumber}`,
        `Application has been logged with LAN number ${payload.lanNumber}. Submission ID: ${payload.submissionId}`,
        'bank_file_logged',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
          lanNumber: payload.lanNumber,
          bankId: payload.bankId,
          bankName: payload.bankName,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank file logged event: ${error.message}`);
    }
  }

  /**
   * Notify bank when a query is raised on an application
   */
  @OnEvent('bank.query.raised')
  async handleBankQueryRaised(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `❓ Query Raised on Application`,
        `A new query has been raised for submission ${payload.submissionId}. Query ID: ${payload.queryId}. Please respond promptly.`,
        'bank_query_raised',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
          queryId: payload.queryId,
          bankId: payload.bankId,
          bankName: payload.bankName,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank query raised event: ${error.message}`);
    }
  }

  /**
   * Notify bank when application is sanctioned (approved)
   */
  @OnEvent('bank.application.sanctioned')
  async handleBankApplicationSanctioned(payload: any) {
    try {
      const amount = payload.sanctionAmount
        ? `₹${Number(payload.sanctionAmount).toLocaleString('en-IN')}`
        : 'the requested amount';
      await this.createNotification(
        'bank',
        `✅ Application Sanctioned`,
        `Application has been successfully sanctioned for ${amount}. Submission ID: ${payload.submissionId}`,
        'bank_sanctioned',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
          sanctionAmount: payload.sanctionAmount,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank sanctioned event: ${error.message}`);
    }
  }

  /**
   * Notify bank when application gets a conditional sanction
   */
  @OnEvent('bank.application.conditional_sanctioned')
  async handleBankConditionalSanctioned(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `📋 Conditional Sanction Issued`,
        `Application has been conditionally sanctioned with ${payload.conditionCount || 'some'} condition(s) to be fulfilled. Submission ID: ${payload.submissionId}`,
        'bank_conditional_sanctioned',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
          conditionCount: payload.conditionCount,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank conditional sanction event: ${error.message}`);
    }
  }

  /**
   * Notify bank when a counter offer is accepted
   */
  @OnEvent('bank.counter_offer.accepted')
  async handleBankCounterOfferAccepted(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `🤝 Counter Offer Accepted`,
        `The applicant has accepted the counter offer for submission ${payload.submissionId}. Ready to proceed to sanctioned stage.`,
        'bank_counter_offer',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank counter offer accepted event: ${error.message}`);
    }
  }

  /**
   * Notify bank when all conditions on a conditional sanction are met
   */
  @OnEvent('bank.conditions.all_met')
  async handleBankConditionsAllMet(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `🎯 All Conditions Met`,
        `All conditions for conditional sanction have been fulfilled for submission ${payload.submissionId}. Ready for final sanctioning.`,
        'bank_sanctioned',
        {
          submissionId: payload.submissionId,
          applicationId: payload.applicationId,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank conditions all met event: ${error.message}`);
    }
  }

  /**
   * Notify bank when a new support message is received for bank conversations
   */
  @OnEvent('bank.chat.received')
  async handleBankChatReceived(payload: any) {
    try {
      await this.createNotification(
        'bank',
        `💬 New Message from Support`,
        payload.content || 'You have a new message from support.',
        'bank_chat_received',
        {
          conversationId: payload.conversationId,
          senderName: payload.senderName || 'Support',
          bank: payload.metadata?.bank || null,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle bank chat received event: ${error.message}`);
    }
  }

  /**
   * Notify staff when a support message is received
   */
  @OnEvent('staff.chat.received')
  async handleStaffChatReceived(payload: any) {
    try {
      const typeLabel = payload.senderType === 'customer' ? 'Student' : 'Bank Partner';
      await this.createNotification(
        'staff',
        `💬 New message from ${payload.senderName || typeLabel}`,
        payload.content || 'You have a new support chat message.',
        'staff_chat_received',
        {
          conversationId: payload.conversationId,
          senderName: payload.senderName,
          senderType: payload.senderType,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to handle staff chat received event: ${error.message}`);
    }
  }

  /**
   * Send PDF receipt via email when loan disbursement is completed
   */
  @OnEvent('bank.application.disbursed')
  async handleBankApplicationDisbursed(payload: {
    applicationId: string;
    userId: string;
    amount: number;
    bankId?: string;
    utrNumber?: string;
    trancheNumber?: number;
    transferMode?: string;
  }) {
    try {
      this.logger.log(`[NotificationService] Handling disbursement notification for app: ${payload.applicationId}`);

      // 1. Fetch LoanApplication
      const { data: application } = await this.db
        .from('LoanApplication')
        .select('*')
        .eq('id', payload.applicationId)
        .single();

      if (!application) {
        this.logger.warn(`Loan application with ID ${payload.applicationId} not found for disbursement notification.`);
        return;
      }

      // 2. Fetch User to get the email
      let email = application.email;
      let borrowerName = `${application.firstName || ''} ${application.lastName || ''}`.trim();

      if (!email || !borrowerName) {
        const { data: user } = await this.db
          .from('User')
          .select('email, firstName, lastName')
          .eq('id', payload.userId || application.userId)
          .single();

        if (user) {
          if (!email) email = user.email;
          if (!borrowerName) borrowerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      }

      if (!email) {
        this.logger.warn(`No email found for borrower of loan application ${payload.applicationId}. Cannot send email.`);
        return;
      }

      // 3. Prepare parameters for PDF
      const details = {
        applicationNumber: application.applicationNumber || 'N/A',
        borrowerName: borrowerName || 'Valued Customer',
        bankName: application.bankName || payload.bankId || 'Partner Bank',
        amount: payload.amount || 0,
        utrNumber: payload.utrNumber || 'N/A',
        trancheNumber: payload.trancheNumber || 1,
        transferMode: payload.transferMode || 'IMPS/NEFT/RTGS',
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      };

      // 4. Generate PDF buffer
      const pdfBuffer = await this.generateDisbursementPdf(details);
      const appPdfBuffer = await this.emailService.generateApplicationPdf(application).catch(err => {
        this.logger.error(`Failed to generate application PDF for disbursement email: ${err.message}`);
        return null;
      });

      // 5. Build premium email body
      const subject = `Successful Disbursement of Your Education Loan - ${details.applicationNumber}`;
      const emailHtml = this.buildDisbursementEmailHtml(details);

      const attachments: any[] = [
        {
          filename: `Disbursement_Receipt_${details.applicationNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ];

      if (appPdfBuffer) {
        attachments.push({
          filename: `Loan_Application_${details.applicationNumber}.pdf`,
          content: appPdfBuffer,
          contentType: 'application/pdf',
        });
      }

      // 6. Send Email with PDF attachments
      await this.emailService.sendMail(
        email,
        subject,
        emailHtml,
        `Dear ${details.borrowerName}, We are pleased to inform you that your education loan tranche of Rs. ${details.amount.toLocaleString('en-IN')} has been successfully disbursed. Please find the receipt attached.`,
        undefined,
        attachments
      );

      // 7. Create in-app notification as well
      await this.createNotification(
        payload.userId || application.userId,
        `💸 Loan Disbursement Successful`,
        `Tranche ${details.trancheNumber} of ₹${details.amount.toLocaleString('en-IN')} has been disbursed. Receipt has been emailed to you.`,
        'bank_disbursed',
        {
          applicationId: payload.applicationId,
          amount: payload.amount,
          utrNumber: details.utrNumber,
        }
      );

    } catch (error) {
      this.logger.error(`Failed to handle bank application disbursed event: ${error.message}`, error.stack);
    }
  }

  /**
   * Programmatically generate premium disbursement receipt PDF buffer using pdfkit
   */
  public generateDisbursementPdf(details: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Styling Palette
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
           .text('Education Loan Portal', 50, 80);

        doc.fillColor(textColor)
           .fontSize(16)
           .text('DISBURSEMENT RECEIPT', 350, 55, { align: 'right' });

        doc.strokeColor(primaryColor)
           .lineWidth(2)
           .moveTo(50, 100)
           .lineTo(550, 100)
           .stroke();

        // --- Details Section ---
        doc.y = 130;

        // Draw a light grey background card for the amount
        doc.fillColor(lightGray)
           .rect(50, doc.y, 500, 70)
           .fill();

        doc.fillColor(textColor)
           .fontSize(11)
           .text('DISBURSED AMOUNT', 70, doc.y + 15);

        doc.fillColor(primaryColor)
           .fontSize(22);
        doc.font('Helvetica-Bold')
           .text(`INR ${Number(details.amount).toLocaleString('en-IN')}.00`, 70, doc.y + 35);
        doc.font('Helvetica');

        doc.y += 90;

        // Details grid
        const drawGridItem = (label: string, value: string, x: number, y: number) => {
          doc.fillColor(darkGray)
             .fontSize(10)
             .text(label, x, y);
          doc.fillColor(textColor)
             .fontSize(11)
             .text(value, x, y + 15, { width: 220 });
        };

        const startY = doc.y;
        drawGridItem('Application Number', details.applicationNumber, 50, startY);
        drawGridItem('Borrower Name', details.borrowerName, 300, startY);

        doc.y += 45;
        const secondY = doc.y;
        drawGridItem('Lending Institution (Bank)', details.bankName, 50, secondY);
        drawGridItem('Disbursement Date', details.date, 300, secondY);

        doc.y += 45;
        const thirdY = doc.y;
        drawGridItem('Transaction Reference (UTR)', details.utrNumber, 50, thirdY);
        drawGridItem('Payment Mode', details.transferMode, 300, thirdY);

        doc.y += 45;
        const fourthY = doc.y;
        drawGridItem('Tranche Number', `Tranche ${details.trancheNumber}`, 50, fourthY);

        // Divider
        doc.y += 60;
        doc.strokeColor('#e5e7eb')
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();

        // --- Note/Disclaimer ---
        doc.y += 20;
        doc.fillColor(darkGray)
           .fontSize(9)
           .text('Please Note:', 50, doc.y, { underline: true });

        doc.text(
          '1. This receipt is digitally generated by Vidya Loan platform upon confirmation of payment from the lending partner.\n' +
          '2. The actual credit time to the beneficiary account might vary depending on bank clearing cycles.\n' +
          '3. For any discrepancies or queries regarding this transfer, please reach out to support@vidyaloan.com or raise a ticket in your student portal.',
          50, doc.y + 15,
          { lineGap: 4, width: 500 }
        );

        // --- Footer ---
        doc.fontSize(8)
           .fillColor('#9ca3af')
           .text('Thank you for choosing Vidya Loan for your education journey.', 50, 700, { align: 'center', width: 500 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Build premium HTML body for disbursement confirmation email
   */
  private buildDisbursementEmailHtml(details: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
        <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 1px;">Vidya Loan</h1>
          <p style="color: #e9d5ff; margin: 5px 0 0 0; font-size: 14px;">Your Education Journey, Funded</p>
        </div>
        
        <div style="padding: 0 10px;">
          <h2 style="color: #111827; margin-bottom: 16px; font-size: 20px;">Loan Disbursement Confirmed!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear <strong>${details.borrowerName}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">We are pleased to inform you that a tranche disbursement for your education loan has been successfully processed by <strong>${details.bankName}</strong>.</p>
          
          <div style="background-color: #f5f3ff; border-left: 4px solid #6605c7; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <span style="color: #7c3aed; font-weight: 600; font-size: 13px; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Amount Disbursed</span>
            <span style="font-size: 28px; font-weight: bold; color: #6605c7; display: block; margin-top: 5px;">₹${Number(details.amount).toLocaleString('en-IN')}.00</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Application Number</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #f3f4f6; color: #111827;">${details.applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Transaction Ref (UTR)</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #f3f4f6; color: #111827;">${details.utrNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Disbursement Date</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #f3f4f6; color: #111827;">${details.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Payment Mode</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #f3f4f6; color: #111827;">${details.transferMode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Tranche</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #111827;">Tranche ${details.trancheNumber}</td>
            </tr>
          </table>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">We have attached the official <strong>Disbursement Receipt PDF</strong> to this email for your reference and records.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://vidyaloan.com'}/student/dashboard" style="background-color: #6605c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(102, 5, 199, 0.2);">
              Go to Student Dashboard
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
              If you have any questions or did not authorize this, please contact our support team immediately at <a href="mailto:support@vidyaloan.com" style="color: #6605c7; text-decoration: none;">support@vidyaloan.com</a>.<br>
              © ${new Date().getFullYear()} Vidya Loan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

