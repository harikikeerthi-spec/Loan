import { Controller, Get, Param, UseGuards, Post, Req, Body, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { S3Service } from '../document/s3.service';
import { UserGuard } from '../auth/user.guard';

@Controller('chat')
@UseGuards(UserGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly s3Service: S3Service
  ) {}

  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.chatService.getConversations('active', req.user);
  }

  @Get('messages/:conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const lim = limit ? parseInt(limit, 10) : undefined;
    const off = offset ? parseInt(offset, 10) : undefined;
    return this.chatService.getMessages(conversationId, lim, off);
  }

  @Post('messages')
  async sendMessage(
    @Req() req: any,
    @Body() body: { conversationId: string; content: string; messageType?: string }
  ) {
    const user = req.user;
    const senderType = user.role || 'staff';
    
    if (!body.conversationId || !body.content) {
      throw new BadRequestException('conversationId and content are required');
    }

    const msg = await this.chatService.sendMessageHttp({
      conversationId: body.conversationId,
      senderType,
      senderId: user.email || user.id || user.sub,
      content: body.content,
      messageType: body.messageType || 'text'
    });

    // Broadcast new message via Socket.IO
    this.chatGateway.broadcastNewMessage(msg, user.role);

    return { success: true, data: msg };
  }

  @Post('messages/:conversationId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const user = req.user;
    const senderType = user.role || 'staff';
    const userId = user.id || user.uid || user.sub || 'unknown';

    // Generate S3 key
    const s3Key = this.s3Service.buildKey(userId, 'chat-attachment', file.originalname);

    // Upload to S3
    await this.s3Service.upload(s3Key, file.buffer, file.mimetype);

    // Generate presigned GET URL valid for 7 days
    const fileUrl = await this.s3Service.getPresignedUrl(s3Key, 604800);

    const isImage = file.mimetype.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';

    // Save message with S3 URL
    const msg = await this.chatService.sendMessageHttp({
      conversationId,
      senderType,
      senderId: user.email || user.id || user.sub,
      content: fileUrl,
      messageType
    });

    // Broadcast new message via Socket.IO
    this.chatGateway.broadcastNewMessage(msg, user.role);

    return { success: true, data: msg };
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
    
    return {
      success: true,
      conversation,
      whatsappUrl: `https://wa.me/${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}?text=Hi Vidyaloan team, I am ${user.firstName} and I would like to connect with a mentor.`
    };
  }

  @Post('staff-start')
  async startConversationWithCustomer(@Req() req: any, @Body() body: { customerPhone: string, customerEmail?: string, customerName?: string, type?: string, bank?: string }) {
    // If type not provided, infer from user role
    const conversationType = body.type || (req.user.role === 'bank' || req.user.role === 'partner_bank' ? 'bank' : 'staff');
    
    // Attempt to identify the bank from the request or user
    const bankName = body.bank || (req.user.role === 'bank' ? req.user.firstName : null);
    
    const conversation = await this.chatService.getOrCreateConversation(
        body.customerPhone,
        body.customerEmail,
        conversationType,
        body.customerName,
        bankName
    );
    
    return {
      success: true,
      conversation
    };
  }
}
