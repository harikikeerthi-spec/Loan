import { Controller, Post, Res, Req, Body, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import * as twilio from 'twilio';

@Controller('webhook/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  @Post()
  async handleIncomingMessage(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    // Note: In production you should validate the Twilio signature here
    // using twilio.validateRequest() but assuming general acceptance for now.
    
    this.logger.log(`Incoming WhatsApp payload: ${JSON.stringify(body)}`);

    const from = body.From; // "whatsapp:+1234567890"
    const content = body.Body;
    const mediaUrl = body.MediaUrl0; // Twilio media URL

    if (!from || (!content && !mediaUrl)) {
      return res.status(400).send('Invalid payload');
    }

    try {
      // 1. Get or create conversation based on phone number
      const conversation = await this.chatService.getOrCreateConversation(from);

      // 2. Save incoming message
      const msg = await this.chatService.saveMessage({
        conversationId: conversation.id,
        senderType: 'customer',
        senderId: from.replace('whatsapp:', ''),
        receiverType: 'system',
        content: content || '[Media Attachment]',
        messageType: mediaUrl ? 'image' : 'text',
        status: 'delivered'
      });

      // 3. Emit real-time event to dashboards
      // Notify active viewers of the conversation
      this.chatGateway.server.to(`conv_${conversation.id}`).emit('new_message', msg);
      
      // Notify global dashboard lists to move conversation to top
      this.chatGateway.server.to('room_staff').to('room_bank').emit('conversation_updated', {
          conversationId: conversation.id,
          lastMessage: msg
      });

      // Respond to Twilio (empty TwiML so no automated response is sent)
      const twiml = new twilio.twiml.MessagingResponse();
      res.type('text/xml').send(twiml.toString());
      
    } catch (error) {
      this.logger.error('Failed to process incoming WhatsApp message', error);
      res.status(500).send('Internal Server Error');
    }
  }
}
