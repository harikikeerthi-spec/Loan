import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TwilioService } from './twilio.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*', // Change in production
  },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly twilioService: TwilioService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
      
      // Allow simulator connections without full JWT if flagged
      const isSimulator = client.handshake.auth.simulator === true;
      const simPhone = client.handshake.auth.phone;

      if (isSimulator && simPhone) {
        const cleanPhone = String(simPhone).replace('whatsapp:', '');
        client.join(`sim_${cleanPhone}`);
        this.logger.log(`Simulator connected for phone: ${cleanPhone}`);
        return;
      }

      if (!token) {
        throw new Error('No token provided');
      }
      
      const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('JWT_SECRET')
      });
      
      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id} (User: ${payload.email}, Role: ${payload.role})`);
      
      // Join general room based on role
      if (payload.role === 'admin' || payload.role === 'staff') {
        client.join('room_staff');
      } else if (payload.role === 'bank') {
        client.join('room_bank');
      }

    } catch (error) {
      this.logger.warn(`Connection rejected: ${client.id} - ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string
  ) {
    client.join(`conv_${conversationId}`);
    return { status: 'joined', conversationId };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string
  ) {
    client.leave(`conv_${conversationId}`);
    return { status: 'left', conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string, customerPhone: string, content: string }
  ) {
    const user = client.data.user;
    const senderType = user.role || 'staff'; // fallback

    try {
      // 1. Save to database
      const msg = await this.chatService.saveMessage({
        conversationId: payload.conversationId,
        senderType,
        senderId: user.email || user.sub,
        receiverType: 'customer',
        content: payload.content,
        status: 'sent'
      });

      // 2. Broadcast to other dashboards observing this conversation
      this.server.to(`conv_${payload.conversationId}`).emit('new_message', msg);
      
      // Also notify general dashboard rooms for list updates
      if (user.role === 'bank' || user.role === 'partner_bank') {
        this.server.to('room_bank').emit('conversation_updated', {
          conversationId: payload.conversationId,
          lastMessage: msg
        });
      } else {
        this.server.to('room_staff').emit('conversation_updated', {
          conversationId: payload.conversationId,
          lastMessage: msg
        });
      }

      // 3. Update WhatsApp Simulator if connected
      const cleanPhone = payload.customerPhone.replace('whatsapp:', '');
      this.server.to(`sim_${cleanPhone}`).emit('wa_message_received', msg);

      // 4. Send out via Twilio WhatsApp (Real)
      if (payload.customerPhone) {
        await this.twilioService.sendWhatsAppMessage(payload.customerPhone, payload.content).catch(e => {
            this.logger.error('Twilio Error (ignoring for simulation): ' + e.message);
        });
      }
      
      return { success: true, message: msg };
    } catch (e) {
      this.logger.error('Failed to process outgoing message', e);
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('sim_customer_reply')
  async handleSimReply(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { phone: string, content: string }
  ) {
    try {
        const from = payload.phone.startsWith('whatsapp:') ? payload.phone : `whatsapp:${payload.phone}`;
        
        // Use existing logic from service/controller
        const conversation = await this.chatService.getOrCreateConversation(from);
        const msg = await this.chatService.saveMessage({
            conversationId: conversation.id,
            senderType: 'customer',
            senderId: payload.phone.replace('whatsapp:', ''),
            content: payload.content,
            status: 'delivered'
        });

        // Broadcast to relevant rooms
        this.server.to(`conv_${conversation.id}`).emit('new_message', msg);
        
        const type = conversation.metadata?.type || 'staff';
        if (type === 'bank') {
          this.server.to('room_bank').emit('conversation_updated', {
            conversationId: conversation.id,
            lastMessage: msg
          });
        } else {
          this.server.to('room_staff').emit('conversation_updated', {
            conversationId: conversation.id,
            lastMessage: msg
          });
        }

        return { success: true, message: msg };
    } catch (e) {
        this.logger.error('Simulator reply failed', e);
        return { success: false, error: e.message };
    }
  }

  @OnEvent('user.login')
  handleUserLogin(payload: any) {
    this.logger.log(`Broadcasting login alert for ${payload.email} to staff`);
    this.server.to('room_staff').emit('user_activity', {
      type: payload.isNewUser ? 'registration' : 'login',
      user: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber
      },
      timestamp: new Date().toISOString()
    });
  }
}
