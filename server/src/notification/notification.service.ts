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
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, user: any) {
    const { data, error } = await this.db
      .from('Notification')
      .update({ isRead: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Mark all notifications as read for the user's role or user ID.
   */
  async markAllAsRead(user: any) {
    const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin' || user.role === 'super_admin';
    const isBank = user.role === 'bank' || user.role === 'partner_bank';
    const userId = user.id || user.uid || user._id;

    let query = this.db.from('Notification').update({ isRead: true });

    if (isStaffOrAdmin) {
      query = query.or(`userId.eq.staff,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
    } else if (isBank) {
      query = query.or(`userId.eq.bank,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
    } else {
      query = query.or(`userId.eq.${userId},userId.eq.all`);
    }

    const { data, error } = await query.eq('isRead', false).select();

    if (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`);
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
}
