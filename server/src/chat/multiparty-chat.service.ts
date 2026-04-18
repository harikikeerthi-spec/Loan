import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from './email.service';

@Injectable()
export class MultiPartyChatService {
  private readonly logger = new Logger(MultiPartyChatService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
  ) {}

  private get db() {
    return this.supabase.getClient();
  }

  /**
   * Create or get multi-party conversation linked to an application
   */
  async getOrCreateMultiPartyConversation(data: {
    applicationId: string;
    customers: Array<{ email: string; fullName: string }>;
    staffMembers?: Array<{ email: string; fullName: string }>;
    bankMembers?: Array<{ email: string; fullName: string }>;
    topic: string;
  }) {
    try {
      // Check if conversation already exists for this application
      let { data: existing } = await this.db
        .from('Conversation')
        .select('id')
        .eq('applicationId', data.applicationId)
        .eq('isMultiParty', true)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Create new multi-party conversation
      const { data: conversation, error: convError } = await this.db
        .from('Conversation')
        .insert({
          applicationId: data.applicationId,
          isMultiParty: true,
          conversationTopic: data.topic,
          metadata: { type: 'multiparty' },
          status: 'active',
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add all participants
      const participants = [
        ...data.customers.map((c) => ({ ...c, role: 'customer' })),
        ...(data.staffMembers || []).map((s) => ({ ...s, role: 'staff' })),
        ...(data.bankMembers || []).map((b) => ({ ...b, role: 'bank' })),
      ];

      for (const participant of participants) {
        await this.db
          .from('Conversation_Participant')
          .insert({
            conversationId: conversation.id,
            email: participant.email,
            fullName: participant.fullName,
            role: participant.role,
            canShare: true,
          })
          .single();
      }

      return conversation;
    } catch (error) {
      this.logger.error('Failed to create multi-party conversation', error);
      throw error;
    }
  }

  /**
   * Save message in multi-party conversation
   */
  async saveMultiPartyMessage(data: {
    conversationId: string;
    senderEmail: string;
    senderName: string;
    senderRole: string;
    content: string;
    messageType?: string;
    recipientEmails?: string[]; // specific recipients, or leave empty for all in conversation
  }) {
    try {
      // Get conversation and participants
      const { data: conversation } = await this.db
        .from('Conversation')
        .select('*')
        .eq('id', data.conversationId)
        .single();

      // Get all participants if recipients not specified
      let recipients = data.recipientEmails;
      if (!recipients || recipients.length === 0) {
        const { data: participants } = await this.db
          .from('Conversation_Participant')
          .select('email, role')
          .eq('conversationId', data.conversationId);

        recipients = participants?.map((p) => p.email) || [];
      }

      // Save message
      const { data: message, error: msgError } = await this.db
        .from('Message')
        .insert({
          conversationId: data.conversationId,
          senderType: data.senderRole,
          senderId: data.senderEmail,
          content: data.content,
          messageType: data.messageType || 'text',
          status: 'sent',
          recipientEmails: recipients,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Create individual recipient records
      for (const email of recipients) {
        const { data: participant } = await this.db
          .from('Conversation_Participant')
          .select('role')
          .eq('conversationId', data.conversationId)
          .eq('email', email)
          .single();

        await this.db
          .from('Message_Recipient')
          .insert({
            messageId: message.id,
            recipientEmail: email,
            recipientRole: participant?.role || 'unknown',
            status: 'delivered',
          });
      }

      // Update conversation timestamp
      await this.db
        .from('Conversation')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', data.conversationId);

      return message;
    } catch (error) {
      this.logger.error('Failed to save multi-party message', error);
      throw error;
    }
  }

  /**
   * Share document across all conversation participants
   */
  async shareDocument(data: {
    conversationId: string;
    applicationId: string;
    documentId: string;
    documentName: string;
    documentType: string;
    uploadedByEmail: string;
    uploaderRole: string;
  }) {
    try {
      // Get all conversation participants
      const { data: participants } = await this.db
        .from('Conversation_Participant')
        .select('email, role, fullName')
        .eq('conversationId', data.conversationId);

      const sharedEmails = participants?.map((p) => p.email) || [];
      const sharedRoles = [...new Set(participants?.map((p) => p.role) || [])];

      // Create document share record
      const { data: docShare, error: shareError } = await this.db
        .from('Document_Share')
        .insert({
          conversationId: data.conversationId,
          applicationId: data.applicationId,
          documentId: data.documentId,
          documentName: data.documentName,
          documentType: data.documentType,
          uploadedBy: data.uploadedByEmail,
          uploaderRole: data.uploaderRole,
          sharedWith: sharedEmails,
          sharedWithRoles: sharedRoles,
          status: 'active',
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Create system message about document share
      await this.saveMultiPartyMessage({
        conversationId: data.conversationId,
        senderEmail: 'system@vidhyaloan.com',
        senderName: 'VidhyaLoan System',
        senderRole: 'system',
        content: `📄 Document shared: ${data.documentName}`,
        messageType: 'document_share',
        recipientEmails: sharedEmails,
      });

      // Send email notifications to all participants
      const uploader = participants?.find((p) => p.email === data.uploadedByEmail);
      for (const participant of participants || []) {
        if (participant.email !== data.uploadedByEmail) {
          const emailSent = await this.emailService.sendDocumentNotificationEmail(
            participant.email,
            {
              documentName: data.documentName,
              uploadedBy: uploader?.fullName || data.uploadedByEmail,
              uploadedByRole: data.uploaderRole,
              applicationNumber: data.applicationId,
              status: 'Shared',
            },
          );

          // Log email
          await this.db.from('Email_Log').insert({
            recipientEmail: participant.email,
            subject: `Document Shared: ${data.documentName}`,
            documentShareId: docShare.id,
            status: emailSent ? 'sent' : 'failed',
          });
        }
      }

      return docShare;
    } catch (error) {
      this.logger.error('Failed to share document', error);
      throw error;
    }
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(data: {
    conversationId: string;
    email: string;
    fullName: string;
    role: string;
  }) {
    try {
      const { data: participant, error } = await this.db
        .from('Conversation_Participant')
        .insert({
          conversationId: data.conversationId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          canShare: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Create system message
      await this.saveMultiPartyMessage({
        conversationId: data.conversationId,
        senderEmail: 'system@vidhyaloan.com',
        senderName: 'VidhyaLoan System',
        senderRole: 'system',
        content: `✅ ${data.fullName} (${data.role}) joined the conversation`,
        messageType: 'participant_joined',
      });

      return participant;
    } catch (error) {
      this.logger.error('Failed to add participant', error);
      throw error;
    }
  }

  /**
   * Get all messages for a conversation with participants info
   */
  async getConversationMessages(conversationId: string, userEmail?: string) {
    try {
      const { data: messages } = await this.db
        .from('Message')
        .select(
          `
          *,
          Message_Recipient (
            recipientEmail,
            recipientRole,
            status,
            readAt
          )
        `,
        )
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      return messages || [];
    } catch (error) {
      this.logger.error('Failed to get conversation messages', error);
      throw error;
    }
  }

  /**
   * Get all shared documents in conversation
   */
  async getConversationDocuments(conversationId: string) {
    try {
      const { data: documents } = await this.db
        .from('Document_Share')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: false });

      return documents || [];
    } catch (error) {
      this.logger.error('Failed to get conversation documents', error);
      throw error;
    }
  }

  /**
   * Get conversations for a user email with participant details
   */
  async getUserConversations(userEmail: string) {
    try {
      const { data: participations } = await this.db
        .from('Conversation_Participant')
        .select(
          `
          conversationId,
          Conversation (
            id,
            applicationId,
            conversationTopic,
            isMultiParty,
            status,
            updatedAt,
            metadata
          )
        `,
        )
        .eq('email', userEmail)
        .eq('isActive', true);

      return participations?.map((p) => p.Conversation) || [];
    } catch (error) {
      this.logger.error('Failed to get user conversations', error);
      throw error;
    }
  }

  /**
   * Get conversation participants
   */
  async getConversationParticipants(conversationId: string) {
    try {
      const { data: participants } = await this.db
        .from('Conversation_Participant')
        .select('*')
        .eq('conversationId', conversationId)
        .eq('isActive', true)
        .order('joinedAt', { ascending: false });

      return participants || [];
    } catch (error) {
      this.logger.error('Failed to get conversation participants', error);
      throw error;
    }
  }

  /**
   * Send email notification for chat message
   */
  async notifyParticipantOfMessage(data: {
    recipientEmail: string;
    senderName: string;
    senderRole: string;
    messageContent: string;
    conversationTopic: string;
    applicationNumber?: string;
    bank?: string;
  }) {
    try {
      const emailSent = await this.emailService.sendChatNotificationEmail(
        data.recipientEmail,
        data.senderName,
        data.senderRole,
        data.messageContent,
        {
          applicationNumber: data.applicationNumber,
          subject: data.conversationTopic,
          bank: data.bank,
        },
      );

      // Log email
      if (emailSent) {
        await this.db.from('Email_Log').insert({
          recipientEmail: data.recipientEmail,
          subject: `New Message: ${data.conversationTopic}`,
          status: 'sent',
        });
      }

      return emailSent;
    } catch (error) {
      this.logger.error('Failed to send notification email', error);
      return false;
    }
  }
}
