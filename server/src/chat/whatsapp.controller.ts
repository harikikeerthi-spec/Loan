import { Controller, Post, Res, Req, Body, Logger, Get, Param } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import * as twilio from 'twilio';

/**
 * WhatsApp Webhook Controller
 * 
 * Twilio sends incoming WhatsApp messages as HTTP POST with:
 *   Content-Type: application/x-www-form-urlencoded
 * 
 * Key fields sent by Twilio:
 *   - From:        "whatsapp:+919876543210"   (sender's WhatsApp number)
 *   - To:          "whatsapp:+14155238886"    (your Twilio sandbox number)
 *   - Body:        "Hello, I need help"        (message text)
 *   - MessageSid:  "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *   - NumMedia:    "0"                         (number of media attachments)
 *   - MediaUrl0:   (only present if NumMedia > 0)
 * 
 * Registered on two paths:
 *   POST /api/webhook/whatsapp   ← recommended (set this in Twilio console)
 *   POST /api/whatsapp           ← alias
 */
@Controller(['webhook/whatsapp', 'whatsapp'])
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  /**
   * Health check endpoint — use this to verify the route is alive
   * GET /api/webhook/whatsapp or GET /api/whatsapp
   */
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      message: 'WhatsApp webhook endpoint is active',
      routes: {
        primary: 'POST /api/webhook/whatsapp',
        alias:   'POST /api/whatsapp',
        history: 'GET  /api/whatsapp/history/:phone',
      },
      note: 'Set one of the above POST URLs in Twilio Console → Sandbox Settings → "When a message comes in"'
    };
  }

  /**
   * Main Twilio webhook handler
   * POST /api/webhook/whatsapp  OR  POST /api/whatsapp
   * 
   * IMPORTANT: Twilio sends application/x-www-form-urlencoded
   * The express.urlencoded() middleware in main.ts handles this parsing.
   */
  @Post()
  async handleIncomingMessage(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    // --- Step 1: Log the full raw payload for debugging ---
    this.logger.log('━━━━━━━━━━ TWILIO WEBHOOK RECEIVED ━━━━━━━━━━');
    this.logger.log(`Content-Type : ${req.headers['content-type']}`);
    this.logger.log(`Raw body keys: ${Object.keys(body || {}).join(', ')}`);
    this.logger.log(`From         : ${body?.From}`);
    this.logger.log(`To           : ${body?.To}`);
    this.logger.log(`Body         : ${body?.Body}`);
    this.logger.log(`MessageSid   : ${body?.MessageSid}`);
    this.logger.log(`NumMedia     : ${body?.NumMedia}`);
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // --- Step 2: Extract fields ---
    const from: string = body?.From;       // "whatsapp:+919876543210"
    const content: string = body?.Body;    // Message text
    const mediaUrl: string = body?.MediaUrl0; // First media URL (if any)
    const messageSid: string = body?.MessageSid;

    // --- Step 3: Validate required fields ---
    if (!from) {
      this.logger.error('[WEBHOOK] Missing "From" field — body may not be parsed (urlencoded issue?)');
      this.logger.error(`Full body dump: ${JSON.stringify(body)}`);
      return res.status(400).send('Missing From field');
    }

    if (!content && !mediaUrl) {
      this.logger.warn('[WEBHOOK] No Body or MediaUrl0 in payload — ignoring');
      // Still return 200 so Twilio doesn't retry
      const twiml = new twilio.twiml.MessagingResponse();
      return res.type('text/xml').send(twiml.toString());
    }

    try {
      // --- Step 4: Get or create the conversation for this phone ---
      const conversation = await this.chatService.getOrCreateConversation(from);
      this.logger.log(`[WEBHOOK] Conversation ID: ${conversation.id} | Phone: ${conversation.customerPhone}`);

      // --- Step 5: Save message to database ---
      const msg = await this.chatService.saveMessage({
        conversationId: conversation.id,
        senderType: 'customer',
        senderId: conversation.customerPhone,
        receiverType: 'system',
        content: content || '[Media Attachment]',
        messageType: mediaUrl ? 'image' : 'text',
        status: 'delivered'
      });
      this.logger.log(`[WEBHOOK] Message saved with ID: ${msg.id}`);

      // --- Step 6: Emit real-time events to the staff dashboard via WebSocket ---
      if (this.chatGateway.server) {
        // Notify staff who are actively viewing this conversation
        this.chatGateway.server.to(`conv_${conversation.id}`).emit('new_message', msg);
        this.logger.log(`[WEBHOOK] Emitted 'new_message' to conv_${conversation.id}`);

        // Notify the global staff dashboard list to update conversation order + badge
        const type = conversation.metadata?.type || 'staff';
        const room = type === 'bank' ? 'room_bank' : 'room_staff';
        this.chatGateway.server.to(room).emit('conversation_updated', {
          conversationId: conversation.id,
          lastMessage: msg
        });
        this.logger.log(`[WEBHOOK] Emitted 'conversation_updated' to ${room}`);
      } else {
        this.logger.warn('[WEBHOOK] WebSocket server not initialized — real-time update skipped');
      }

      // --- Step 7: Respond to Twilio with empty TwiML (no auto-reply) ---
      // Staff will reply manually via the dashboard
      const twiml = new twilio.twiml.MessagingResponse();
      // Uncomment below to send an auto-acknowledgement:
      // twiml.message('Thanks for reaching out to Vidhya Loans! A support agent will respond shortly. 🙏');
      
      this.logger.log('[WEBHOOK] Responding to Twilio with 200 OK (empty TwiML)');
      return res.type('text/xml').send(twiml.toString());

    } catch (error) {
      this.logger.error('[WEBHOOK] Failed to process incoming WhatsApp message:', error?.message);
      this.logger.error(error);
      // Still return 200 so Twilio doesn't retry and spam your logs
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  }

  /**
   * Get message history for a phone number
   * GET /api/whatsapp/history/:phone
   */
  @Get('history/:phone')
  async getHistory(@Param('phone') phone: string) {
    const cleanPhone = phone.replace('whatsapp:', '').trim().replace(/\D/g, '');
    const phoneNo = cleanPhone.length > 10 && cleanPhone.startsWith('91') ? cleanPhone.substring(2) : (cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone);
    
    try {
      const { data: convData } = await this.chatService.db
        .from('Conversation')
        .select('id, customerPhone')
        .eq('customerPhone', phoneNo)
        .eq('status', 'active')
        .limit(1);
      
      const conv = convData?.[0];
      if (conv) {
        await this.chatService.markMessagesAsRead(conv.id, 'customer');
        if (this.chatGateway.server) {
          this.chatGateway.server.to(`conv_${conv.id}`).emit('messages_read', {
            conversationId: conv.id,
            readerType: 'customer',
            readerId: conv.customerPhone || 'customer'
          });
          this.chatGateway.server.to('room_staff').emit('conversation_updated', {
            conversationId: conv.id
          });
          this.chatGateway.server.to('room_bank').emit('conversation_updated', {
            conversationId: conv.id
          });
        }
      }
    } catch (e) {
      this.logger.error(`Failed to auto-mark messages as read in history: ${e.message}`);
    }

    return this.chatService.getMessagesByPhone(phone);
  }
}

