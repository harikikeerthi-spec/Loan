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
      // We emit to everyone in the room EXCEPT the sender (handled automatically by broadcast to room)
      // or we can emit to everyone including sender so they see it appear.
      this.server.to(`conv_${payload.conversationId}`).emit('new_message', msg);
      
      // Also notify general dashboard rooms for list updates
      this.server.to('room_staff').to('room_bank').emit('conversation_updated', {
          conversationId: payload.conversationId,
          lastMessage: msg
      });

      // 3. Send out via Twilio WhatsApp
      await this.twilioService.sendWhatsAppMessage(payload.customerPhone, payload.content);
      
      return { success: true, message: msg };
    } catch (e) {
      this.logger.error('Failed to process outgoing message', e);
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
