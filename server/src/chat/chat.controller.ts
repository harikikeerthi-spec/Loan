import { Controller, Get, Param, UseGuards, Post, Req, Body, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UserGuard } from '../auth/user.guard';

@Controller('chat')
@UseGuards(UserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.chatService.getConversations('active', req.user);
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

  @Post('bank-start')
  async startBankConversation(@Req() req: any, @Body() body: { bankName: string, bankEmail?: string, applicationId?: string, applicationNumber?: string }) {
    if (!body.bankName) {
      return { success: false, error: 'bankName is required' };
    }

    // Create a stable synthetic phone identifier for this bank channel
    // Using a format that won't conflict with real phone numbers
    const safeBank = body.bankName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const syntheticPhone = body.applicationId
      ? `BNK_${safeBank}_APP_${body.applicationId}`
      : `BNK_${safeBank}`;

    const shortAppId = body.applicationNumber || (body.applicationId ? body.applicationId.slice(0, 8) : '');
    const displayName = body.applicationId
      ? `${body.bankName} - App #${shortAppId}`
      : `${body.bankName} (Bank)`;

    const conversation = await this.chatService.getOrCreateConversation(
      syntheticPhone,
      body.bankEmail || `bank+${safeBank.toLowerCase()}@internal`,
      'bank',
      displayName,
      body.bankName,
      {
        applicationId: body.applicationId || null,
        applicationNumber: body.applicationNumber || null,
      }
    );

    return {
      success: true,
      conversation
    };
  }
}
