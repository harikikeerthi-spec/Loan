import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  async getOrCreateConversation(customerPhone: string, customerEmail?: string, conversationType: string = 'staff', customerName?: string) {
    if (!customerPhone) {
        throw new HttpException('A valid phone number is required to start a chat. Please update your profile.', HttpStatus.BAD_REQUEST);
    }
    // Clean phone number (strip 'whatsapp:' if present)
    const phone = customerPhone.replace('whatsapp:', '');

    // Check if open conversation exists
    let { data: conv, error } = await this.db
      .from('Conversation')
      .select('*')
      .eq('customerPhone', phone)
      .eq('status', 'active')
      .single();

    if (!conv) {
      // Create new
      const { data: newConv, error: createError } = await this.db
        .from('Conversation')
        .insert({ 
            customerPhone: phone, 
            status: 'active',
            customerEmail: customerEmail || null,
            customerName: customerName || null,
            metadata: { type: conversationType }
        })
        .select()
        .single();
        
      if (createError) {
        this.logger.error('Failed to create conversation', createError);
        throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      conv = newConv;
    }

    return conv;
  }

  async saveMessage(data: {
    conversationId: string;
    senderType: string;
    senderId: string;
    receiverType?: string;
    content: string;
    messageType?: string;
    status?: string;
  }) {
    const { data: message, error } = await this.db
      .from('Message')
      .insert({
        ...data,
        messageType: data.messageType || 'text',
        status: data.status || 'sent'
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to save message', error);
      throw new HttpException('Database error saving message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    // Update conversation timestamp
    await this.db
      .from('Conversation')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', data.conversationId);

    return message;
  }

  async getConversations(status: string = 'active') {
      const { data, error } = await this.db
      .from('Conversation')
      .select(`
          id, customerPhone, customerEmail, customerName, metadata, status, updatedAt, createdAt,
          Message (id, content, senderType, createdAt, status)
      `)
      .eq('status', status)
      .order('updatedAt', { ascending: false });
      
      if (error) {
          throw new HttpException('Db Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      // Sort messages and format
      return data.map((conv: any) => ({
          ...conv,
          lastMessage: conv.Message && conv.Message.length > 0 
              ? conv.Message.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              : null
      }));
  }

  async getMessages(conversationId: string) {
    const { data, error } = await this.db
      .from('Message')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new HttpException('Db Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }
}
