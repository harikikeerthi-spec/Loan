import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  private normalizePhone(phoneStr: string): string {
    // Synthetic bank identifiers start with BNK_ — pass through unchanged
    if (phoneStr.startsWith('BNK_')) return phoneStr;
    const cleaned = phoneStr.replace('whatsapp:', '').trim().replace(/\D/g, '');
    if (cleaned.length > 10 && cleaned.startsWith('91')) {
      return cleaned.substring(2);
    }
    if (cleaned.length > 10) {
      return cleaned.slice(-10);
    }
    return cleaned;
  }

  async getOrCreateConversation(customerPhone: string, customerEmail?: string, conversationType: string = 'staff', customerName?: string, bankName?: string, additionalMetadata?: any) {
    if (!customerPhone) {
        throw new HttpException('A valid phone number is required to start a chat. Please update your profile.', HttpStatus.BAD_REQUEST);
    }
    // Clean phone number (strip 'whatsapp:' and normalize to 10 digits)
    const phone = this.normalizePhone(customerPhone);

    // Check if conversation exists by phone number (since customerPhone is unique)
    let { data: conv, error } = await this.db
      .from('Conversation')
      .select('*')
      .eq('customerPhone', phone)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to query conversation', error);
      throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const mergedMetadata = {
      type: conversationType,
      bank: bankName || null,
      ...(additionalMetadata || {})
    };

    if (!conv) {
      // Create new
      const { data: newConv, error: createError } = await this.db
        .from('Conversation')
        .insert({ 
            customerPhone: phone, 
            status: 'active',
            customerEmail: customerEmail || null,
            customerName: customerName || null,
            metadata: mergedMetadata
        })
        .select()
        .single();
        
      if (createError) {
        this.logger.error('Failed to create conversation', createError);
        throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      conv = newConv;
    } else {
      // Reactivate or update existing conversation metadata
      const updateData: any = {
        status: 'active',
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(conv.metadata || {}),
          ...mergedMetadata
        }
      };
      if (customerEmail) updateData.customerEmail = customerEmail;
      if (customerName) updateData.customerName = customerName;

      const { data: updatedConv, error: updateError } = await this.db
        .from('Conversation')
        .update(updateData)
        .eq('id', conv.id)
        .select()
        .single();

      if (updateError) {
        this.logger.error('Failed to reactivate conversation', updateError);
        throw new HttpException('Database error reactivating conversation', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      conv = updatedConv;
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

  async getConversations(status: string = 'active', user?: any) {
      let query = this.db
      .from('Conversation')
      .select(`
          id, customerPhone, customerEmail, customerName, metadata, status, updatedAt, createdAt,
          Message (id, content, senderType, createdAt, status)
      `)
      .eq('status', status)
      .order('updatedAt', { ascending: false });

      // Role-based filtering
      if (user && (user.role === 'bank' || user.role === 'partner_bank')) {
          // Bank partners should only see conversations explicitly marked for banks
          query = query.contains('metadata', { type: 'bank' });
          
          // If the user has an associated bank, filter by it.
          const bankName = user.bankName || (user.firstName && user.firstName.includes('Bank') ? user.firstName : null);
          if (bankName) {
              query = query.contains('metadata', { bank: bankName });
          }
      } else if (user && user.role === 'agent') {
          // Agents see conversations marked for agents
          query = query.contains('metadata', { type: 'agent' });
      }

      const { data, error } = await query;
      
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

  async getMessagesByPhone(phone: string) {
    const cleanPhone = this.normalizePhone(phone);
    
    // Find conversation first
    const { data: conv } = await this.db
      .from('Conversation')
      .select('id')
      .eq('customerPhone', cleanPhone)
      .eq('status', 'active')
      .maybeSingle();

    if (!conv) return [];

    return this.getMessages(conv.id);
  }
}
