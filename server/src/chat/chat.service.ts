import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  get db() {
    return this.supabase.getClient();
  }

  private normalizePhone(phoneStr: string): string {
    // Synthetic bank/staff identifiers start with BNK_ or STF_ — pass through unchanged
    if (phoneStr.startsWith('BNK_') || phoneStr.startsWith('STF_')) return phoneStr;
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

    let query = this.db
      .from('Conversation')
      .select('*')
      .eq('customerPhone', phone);

    if (additionalMetadata && additionalMetadata.applicationId) {
      query = query.contains('metadata', { applicationId: additionalMetadata.applicationId });
    }

    let { data: convData, error } = await query.order('updatedAt', { ascending: false }).limit(1);
    let conv = convData?.[0] || null;

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
    attachmentUrl?: string;
    attachmentType?: string;
    senderName?: string;
  }) {
    const { senderName, ...insertPayload } = data;
    const { data: message, error } = await this.db
      .from('Message')
      .insert({
        ...insertPayload,
        messageType: data.messageType || 'text',
        status: data.status || 'sent'
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to save message', error);
      try {
        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(
          path.join(process.cwd(), 'chat_error.log'),
          `${new Date().toISOString()} - Payload: ${JSON.stringify(insertPayload)} - Error: ${JSON.stringify(error)}\n`
        );
      } catch (err) {
        this.logger.error('Failed to write chat_error.log', err);
      }
      throw new HttpException('Database error saving message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    // Update conversation timestamp
    await this.db
      .from('Conversation')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', data.conversationId);

    try {
      const conv = await this.getConversationById(data.conversationId);
      if (conv?.metadata?.type === 'bank' && ['staff', 'admin', 'super_admin', 'support', 'system'].includes(data.senderType)) {
        this.eventEmitter.emit('bank.chat.received', {
          conversationId: data.conversationId,
          senderName: data.senderName || 'Support',
          content: data.content,
          metadata: conv.metadata
        });
      }
      
      if (['customer', 'bank', 'partner_bank'].includes(data.senderType)) {
        this.eventEmitter.emit('staff.chat.received', {
          conversationId: data.conversationId,
          senderName: data.senderName || (data.senderType === 'customer' ? 'Student' : 'Bank Partner'),
          content: data.content,
          senderType: data.senderType,
          metadata: conv?.metadata || {}
        });
      }
    } catch (e) {
      this.logger.error('Failed to emit bank chat notification event', e);
    }

    return message;
  }

  async getConversations(status: string = 'active', user?: any) {
      let query = this.db
      .from('Conversation')
      .select(`
          id, customerPhone, customerEmail, customerName, metadata, status, updatedAt, createdAt,
          Message (id, content, senderType, senderId, createdAt, status)
      `)
      .eq('status', status)
      .order('updatedAt', { ascending: false });

      // Role-based filtering
      if (user && (user.role === 'bank' || user.role === 'partner_bank')) {
          // Bank partners should only see conversations explicitly marked for banks
          query = query.contains('metadata', { type: 'bank' });
          
          // Priority: explicit bankName > user.bankName > user.firstName
          // The frontend sends the resolved full bank name (e.g. "IDFC FIRST Bank")
          const bankName = user.bankName || user.firstName || null;
          if (bankName) {
              this.logger.debug(`Filtering conversations for bank: ${bankName}`);
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
      let formatted = data.map((conv: any) => {
          const sortedMessages = conv.Message && conv.Message.length > 0
              ? conv.Message.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              : [];
          
          let unreadCount = 0;
          if (user) {
              const isBank = user.role === 'bank' || user.role === 'partner_bank';
              unreadCount = sortedMessages.filter((m: any) => {
                  if (m.status === 'read') return false;
                  if (isBank) {
                      return m.senderType !== 'bank' && m.senderType !== 'partner_bank';
                  } else {
                      return m.senderType !== 'staff' && m.senderType !== 'admin' && m.senderType !== 'super_admin' && m.senderType !== 'agent';
                  }
              }).length;
          }

          return {
              ...conv,
              lastMessage: sortedMessages[0] || null,
              unreadCount
          };
      });

      if (user && user.role === 'support') {
          formatted = formatted.filter((conv: any) => 
              conv.metadata?.type === 'support_to_staff' || 
              conv.metadata?.type === 'support_to_bank'
          );
      }

      return formatted;
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

  async getMessageById(messageId: string) {
    const { data, error } = await this.db
      .from('Message')
      .select('*')
      .eq('id', messageId)
      .maybeSingle();

    if (error) {
      throw new HttpException('Db Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getMessagesByPhone(phone: string) {
    const cleanPhone = this.normalizePhone(phone);
    
    // Find most recently updated active conversation first
    const { data: convData } = await this.db
      .from('Conversation')
      .select('id')
      .eq('customerPhone', cleanPhone)
      .eq('status', 'active')
      .order('updatedAt', { ascending: false })
      .limit(1);

    const conv = convData?.[0] || null;
    if (!conv) return [];

    return this.getMessages(conv.id);
  }

  async getConversationById(id: string) {
    const { data, error } = await this.db
      .from('Conversation')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new HttpException('Db Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async markMessagesAsRead(conversationId: string, readerType: 'customer' | 'staff_or_bank', readerRole?: string) {
    let convType = 'staff';
    try {
      const { data: conv } = await this.db
        .from('Conversation')
        .select('metadata')
        .eq('id', conversationId)
        .maybeSingle();
      if (conv?.metadata?.type) {
        convType = conv.metadata.type;
      }
    } catch (e) {
      this.logger.error('Failed to fetch conversation metadata for markMessagesAsRead', e);
    }

    let query = this.db
      .from('Message')
      .update({ status: 'read' })
      .eq('conversationId', conversationId)
      .neq('status', 'read');

    const role = readerRole || (readerType === 'customer' ? 'customer' : 'staff');

    if (convType === 'support_to_staff' || convType === 'support_to_bank') {
      if (role === 'support') {
        query = query.neq('senderType', 'support');
      } else {
        query = query.eq('senderType', 'support');
      }
    } else if (convType === 'bank') {
      const isBankRole = ['bank', 'partner_bank'].includes(role);
      if (isBankRole) {
        query = query.neq('senderType', 'bank').neq('senderType', 'partner_bank');
      } else {
        query = query.in('senderType', ['bank', 'partner_bank']);
      }
    } else {
      if (readerType === 'customer' || role === 'customer') {
        query = query.neq('senderType', 'customer');
      } else {
        query = query.eq('senderType', 'customer');
      }
    }

    const { data, error } = await query.select();

    if (error) {
      this.logger.error('Failed to mark messages as read', error);
      throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async editMessage(messageId: string, newContent: string) {
    const { data, error } = await this.db
      .from('Message')
      .update({ content: newContent })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to edit message', error);
      throw new HttpException('Database error editing message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async deleteMessage(messageId: string) {
    const { error } = await this.db
      .from('Message')
      .delete()
      .eq('id', messageId);

    if (error) {
      this.logger.error('Failed to delete message', error);
      throw new HttpException('Database error deleting message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return true;
  }
}

