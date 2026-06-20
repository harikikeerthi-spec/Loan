import { Controller, Get, Param, UseGuards, Post, Req, Body, Query, UseInterceptors, UploadedFile, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatService } from './chat.service';
import { UserGuard } from '../auth/user.guard';
import { S3Service } from '../document/s3.service';
import { memoryStorage } from 'multer';
import type { Response } from 'express';

const storage = memoryStorage();

@Controller('chat')
@UseGuards(UserGuard)
export class ChatController {
  constructor(
      private readonly chatService: ChatService,
      private readonly s3Service: S3Service,
      private readonly eventEmitter: EventEmitter2
  ) {}

  @Get('conversations')
  async getConversations(@Req() req: any, @Query('bankName') bankName?: string) {
    // For bank users: if explicit bankName is passed from client, use it;
    // otherwise fall back to the user object's bankName / firstName
    const userWithBank = { ...req.user };
    if (bankName) {
      userWithBank.bankName = bankName;
    }
    return this.chatService.getConversations('active', userWithBank);
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('connect')
  async connectToStaff(@Req() req: any) {
    const user = req.user;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    // Create or get conversation
    const conversation = await this.chatService.getOrCreateConversation(
        user.phoneNumber, 
        user.email, 
        'staff',
        fullName || undefined
    );
    
    const rawNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
    const cleanNumber = rawNumber.replace('whatsapp:', '').replace(/\D/g, '');
    
    return {
      success: true,
      conversation,
      whatsappUrl: `https://wa.me/${cleanNumber}?text=Hi Vidyaloan team, I am ${user.firstName} and I would like to connect with a mentor.`
    };
  }

  @Post('staff-start')
  async startConversationWithCustomer(@Req() req: any, @Body() body: { customerPhone: string, customerEmail?: string, customerName?: string, type?: string, bank?: string, applicationId?: string, applicationNumber?: string }) {
    // If type not provided, infer from user role
    const conversationType = body.type || (req.user.role === 'bank' || req.user.role === 'partner_bank' ? 'bank' : 'staff');
    
    // Attempt to identify the bank from the request or user
    const bankName = body.bank || (req.user.role === 'bank' ? req.user.firstName : null);
    
    const additionalMetadata: any = {};
    if (body.applicationId) additionalMetadata.applicationId = body.applicationId;
    if (body.applicationNumber) additionalMetadata.applicationNumber = body.applicationNumber;

    const conversation = await this.chatService.getOrCreateConversation(
        body.customerPhone,
        body.customerEmail,
        conversationType,
        body.customerName,
        bankName,
        additionalMetadata
    );
    
    return {
      success: true,
      conversation
    };
  }

  @Post('bank-start')
  async startBankConversation(@Req() req: any, @Body() body: { bankName: string, bankEmail?: string, applicationId?: string, applicationNumber?: string }) {
    if (!body.bankName) {
      return { success: false, error: 'bankName is required' };
    }

    // Normalize bankName to match session mappings
    let bankName = body.bankName;
    const BANK_NAME_MAP: Record<string, string> = {
      auxilo: "Auxilo Finserve",
      avanse: "Avanse Financial",
      credila: "HDFC Credila",
      idfc: "IDFC FIRST Bank",
      poonawalla: "Poonawalla Fincorp",
    };
    const lower = bankName.toLowerCase().trim();
    for (const [key, val] of Object.entries(BANK_NAME_MAP)) {
      if (lower.includes(key)) {
        bankName = val;
        break;
      }
    }

    // Create a stable synthetic phone identifier for this bank channel
    // Using a format that won't conflict with real phone numbers
    const safeBank = bankName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const syntheticPhone = body.applicationId
      ? `BNK_${safeBank}_APP_${body.applicationId}`
      : `BNK_${safeBank}`;

    let studentName = '';
    let appNumber = body.applicationNumber || '';

    if (body.applicationId) {
      try {
        const { data: application } = await this.chatService.db
          .from('LoanApplication')
          .select('firstName, lastName, applicationNumber')
          .eq('id', body.applicationId)
          .single();
        if (application) {
          studentName = `${application.firstName || ''} ${application.lastName || ''}`.trim();
          if (!appNumber && application.applicationNumber) {
            appNumber = application.applicationNumber;
          }
        }
      } catch (err) {
        console.error('Failed to fetch student name for bank conversation:', err);
      }
    }

    const shortAppId = appNumber || (body.applicationId ? body.applicationId.slice(0, 8) : '');
    const displayName = body.applicationId
      ? `${bankName} - App #${shortAppId}`
      : `${bankName} (Bank)`;

    const conversation = await this.chatService.getOrCreateConversation(
      syntheticPhone,
      body.bankEmail || `bank+${safeBank.toLowerCase()}@internal`,
      'bank',
      displayName,
      bankName,
      {
        applicationId: body.applicationId || null,
        applicationNumber: appNumber || null,
        studentName: studentName || null,
      }
    );

    return {
      success: true,
      conversation
    };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit for chat
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file type for chat attachment'), false);
        }
      },
    }),
  )
  async uploadFile(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!conversationId) throw new BadRequestException('conversationId is required');

    const user = req.user;
    const senderType = user.role || 'staff';
    const senderId = user.email || user.sub;
    const senderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined;

    const s3Key = `chat_attachments/${conversationId}/${Date.now()}_${file.originalname}`;
    let attachmentUrl = '';

    try {
      await this.s3Service.upload(s3Key, file.buffer, file.mimetype);
      attachmentUrl = s3Key;
    } catch (s3Error: any) {
      console.warn(`[CHAT UPLOAD] S3 Upload failed: ${s3Error.message}. Falling back to local storage.`);
      try {
        const fs = require('fs');
        const path = require('path');
        const localDir = path.join(process.cwd(), 'uploads', 'chat', conversationId);
        fs.mkdirSync(localDir, { recursive: true });
        fs.writeFileSync(path.join(localDir, file.originalname), file.buffer);
        attachmentUrl = `local:${conversationId}/${file.originalname}`;
      } catch (err) {
        throw new BadRequestException('Failed to store file');
      }
    }

    const isImage = file.mimetype.startsWith('image/');

    const msg = await this.chatService.saveMessage({
      conversationId,
      senderType,
      senderId,
      senderName,
      content: file.originalname,
      messageType: isImage ? 'image' : 'document',
      status: 'sent',
      attachmentUrl,
      attachmentType: file.mimetype
    });

    this.eventEmitter.emit('chat.message_created', msg);

    // Optionally you could emit an event here, or rely on frontend to emit via socket once upload is done
    return { success: true, message: msg };
  }

  @Post('share-document')
  async shareDocument(
    @Req() req: any,
    @Body() body: {
      conversationId: string;
      fileName: string;
      filePath: string;
      mimeType?: string;
    }
  ) {
    if (!body.conversationId) throw new BadRequestException('conversationId is required');
    if (!body.filePath) throw new BadRequestException('filePath is required');

    const user = req.user;
    const senderType = user.role || 'staff';
    const senderId = user.email || user.sub;
    const senderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined;

    const isImage = body.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)/i.test(body.fileName);

    const msg = await this.chatService.saveMessage({
      conversationId: body.conversationId,
      senderType,
      senderId,
      senderName,
      content: body.fileName,
      messageType: isImage ? 'image' : 'document',
      status: 'sent',
      attachmentUrl: body.filePath,
      attachmentType: body.mimeType || 'application/pdf'
    });

    this.eventEmitter.emit('chat.message_created', msg);

    return { success: true, message: msg };
  }

  @Get('attachment/:messageId')
  async getAttachment(
    @Param('messageId') messageId: string,
    @Res() res: Response
  ) {
    const msg = await this.chatService.getMessageById(messageId);
    if (!msg || !msg.attachmentUrl) {
      throw new NotFoundException('Attachment not found');
    }

    const fs = require('fs');
    const path = require('path');
    let targetPath = '';

    if (msg.attachmentUrl.startsWith('local:')) {
      const [, relativePath] = msg.attachmentUrl.split('local:');
      targetPath = path.join(process.cwd(), 'uploads', 'chat', relativePath);
    } else {
      // Check if it exists as a local file path on server's disk
      const possiblePath = path.isAbsolute(msg.attachmentUrl)
        ? msg.attachmentUrl
        : path.join(process.cwd(), msg.attachmentUrl);
      if (fs.existsSync(possiblePath) && fs.statSync(possiblePath).isFile()) {
        targetPath = possiblePath;
      }
    }

    if (targetPath) {
      return res.sendFile(targetPath);
    }

    try {
      const presignedUrl = await this.s3Service.getPresignedUrl(msg.attachmentUrl, 3600);
      return res.redirect(302, presignedUrl);
    } catch (err) {
      console.error('[CHAT ATTACHMENT] Failed to generate presigned URL:', err);
      throw new NotFoundException('Unable to retrieve attachment from storage.');
    }
  }

  @Post('support-start-staff')
  async startSupportToStaffConversation(
    @Req() req: any,
    @Body() body: { staffEmail: string; staffName?: string }
  ) {
    if (!body.staffEmail) {
      throw new BadRequestException('staffEmail is required');
    }

    const safeStaff = body.staffEmail.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const syntheticPhone = `STF_${safeStaff}`;

    const displayName = body.staffName
      ? `Support & ${body.staffName}`
      : `Support & Staff (${body.staffEmail})`;

    const conversation = await this.chatService.getOrCreateConversation(
      syntheticPhone,
      body.staffEmail,
      'support_to_staff',
      displayName,
      undefined,
      {
        staffEmail: body.staffEmail,
      }
    );

    return {
      success: true,
      conversation,
    };
  }

  @Post('support-start-bank')
  async startSupportToBankConversation(
    @Req() req: any,
    @Body() body: { bankName: string; bankEmail?: string }
  ) {
    if (!body.bankName) {
      throw new BadRequestException('bankName is required');
    }

    const safeBank = body.bankName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const syntheticPhone = `BNK_${safeBank}_SUP`;

    const displayName = `Support & ${body.bankName}`;

    const conversation = await this.chatService.getOrCreateConversation(
      syntheticPhone,
      body.bankEmail || `bank+${safeBank.toLowerCase()}@internal`,
      'support_to_bank',
      displayName,
      body.bankName,
      {
        bankName: body.bankName,
        bankEmail: body.bankEmail || null,
      }
    );

    return {
      success: true,
      conversation,
    };
  }
}
