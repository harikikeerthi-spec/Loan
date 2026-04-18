import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MultiPartyChatService } from './multiparty-chat.service';
import { UserGuard } from '../auth/user.guard';


@Controller('chat')
@UseGuards(UserGuard)

export class MultiPartyChatController {
  private readonly logger = new Logger(MultiPartyChatController.name);

  constructor(private readonly multiPartyChatService: MultiPartyChatService) {}

  /**
   * Create multi-party conversation linked to an application
   */
  @Post('multiparty/create')
  async createMultiPartyConversation(
    @Request() req,
    @Body()
    body: {
      applicationId: string;
      customers: Array<{ email: string; fullName: string }>;
      staffMembers?: Array<{ email: string; fullName: string }>;
      bankMembers?: Array<{ email: string; fullName: string }>;
      topic: string;
    },
  ) {
    try {
      const conversation = await this.multiPartyChatService.getOrCreateMultiPartyConversation(body);
      return {
        success: true,
        data: conversation,
        message: 'Multi-party conversation created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create multi-party conversation', error);
      throw new HttpException('Failed to create conversation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get user's conversations
   */
  @Get('conversations/my')
  async getMyConversations(@Request() req) {
    try {
      const conversations = await this.multiPartyChatService.getUserConversations(req.user.email);
      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      throw new HttpException('Failed to fetch conversations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get conversation details with participants and documents
   */
  @Get('multiparty/:conversationId/details')
  async getConversationDetails(@Param('conversationId') conversationId: string) {
    try {
      const [messages, documents, participants] = await Promise.all([
        this.multiPartyChatService.getConversationMessages(conversationId),
        this.multiPartyChatService.getConversationDocuments(conversationId),
        this.multiPartyChatService.getConversationParticipants(conversationId),
      ]);

      return {
        success: true,
        data: {
          messages,
          documents,
          participants,
        },
      };
    } catch (error) {
      throw new HttpException('Failed to fetch conversation details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get conversation messages
   */
  @Get('multiparty/:conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    try {
      const messages = await this.multiPartyChatService.getConversationMessages(
        conversationId,
        req.user.email,
      );
      return {
        success: true,
        data: messages,
      };
    } catch (error) {
      throw new HttpException('Failed to fetch messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send message in multi-party conversation
   */
  @Post('multiparty/:conversationId/message')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Body() body: { content: string; recipientEmails?: string[] },
  ) {
    try {
      const message = await this.multiPartyChatService.saveMultiPartyMessage({
        conversationId,
        senderEmail: req.user.email,
        senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        senderRole: req.user.role,
        content: body.content,
        messageType: 'text',
        recipientEmails: body.recipientEmails,
      });

      return {
        success: true,
        data: message,
        message: 'Message sent successfully',
      };
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw new HttpException('Failed to send message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Share document in conversation
   */
  @Post('multiparty/:conversationId/share-document')
  async shareDocument(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Body()
    body: {
      applicationId: string;
      documentId: string;
      documentName: string;
      documentType: string;
    },
  ) {
    try {
      const docShare = await this.multiPartyChatService.shareDocument({
        conversationId,
        applicationId: body.applicationId,
        documentId: body.documentId,
        documentName: body.documentName,
        documentType: body.documentType,
        uploadedByEmail: req.user.email,
        uploaderRole: req.user.role,
      });

      return {
        success: true,
        data: docShare,
        message: 'Document shared successfully',
      };
    } catch (error) {
      this.logger.error('Failed to share document', error);
      throw new HttpException('Failed to share document', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get shared documents
   */
  @Get('multiparty/:conversationId/documents')
  async getSharedDocuments(@Param('conversationId') conversationId: string) {
    try {
      const documents = await this.multiPartyChatService.getConversationDocuments(conversationId);
      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      throw new HttpException('Failed to fetch documents', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Add participant to conversation
   */
  @Post('multiparty/:conversationId/participant')
  async addParticipant(
    @Param('conversationId') conversationId: string,
    @Body() body: { email: string; fullName: string; role: string },
  ) {
    try {
      const participant = await this.multiPartyChatService.addParticipant({
        conversationId,
        email: body.email,
        fullName: body.fullName,
        role: body.role,
      });

      return {
        success: true,
        data: participant,
        message: 'Participant added successfully',
      };
    } catch (error) {
      this.logger.error('Failed to add participant', error);
      throw new HttpException('Failed to add participant', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get conversation participants
   */
  @Get('multiparty/:conversationId/participants')
  async getParticipants(@Param('conversationId') conversationId: string) {
    try {
      const participants = await this.multiPartyChatService.getConversationParticipants(
        conversationId,
      );
      return {
        success: true,
        data: participants,
      };
    } catch (error) {
      throw new HttpException('Failed to fetch participants', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send email notification for message (Admin/Staff)
   */
  @Post('multiparty/:conversationId/notify-email')
  async notifyByEmail(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Body()
    body: {
      recipientEmail: string;
      messageContent: string;
      conversationTopic: string;
      applicationNumber?: string;
      bank?: string;
    },
  ) {
    try {
      // Only staff and admin can send notification emails
      if (!['staff', 'admin', 'super_admin', 'bank', 'partner_bank'].includes(req.user.role)) {
        throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
      }

      const emailSent = await this.multiPartyChatService.notifyParticipantOfMessage({
        recipientEmail: body.recipientEmail,
        senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        senderRole: req.user.role,
        messageContent: body.messageContent,
        conversationTopic: body.conversationTopic,
        applicationNumber: body.applicationNumber,
        bank: body.bank,
      });

      return {
        success: emailSent,
        message: emailSent ? 'Email sent successfully' : 'Failed to send email',
      };
    } catch (error) {
      this.logger.error('Failed to send notification email', error);
      throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
