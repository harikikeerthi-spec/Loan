import { Controller, Get, Param, UseGuards, Post, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UserGuard } from '../auth/user.guard';

@Controller('chat')
@UseGuards(UserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations() {
    return this.chatService.getConversations();
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
    
    // The Gateway will be notified via the service if we set it up, 
    // but for now let's just return the info.
    // We should actually trigger a socket emit here.
    
    return {
      success: true,
      conversation,
      whatsappUrl: `https://wa.me/${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}?text=Hi Vidhyaloan team, I am ${user.firstName} and I would like to connect with a mentor.`
    };
  }
}
