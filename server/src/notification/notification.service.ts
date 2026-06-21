import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
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
}

