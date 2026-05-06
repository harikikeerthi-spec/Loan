import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  async getUserNotifications(userId: string) {
    const { data, error } = await this.db
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[NotificationService.getUserNotifications] error:', error);
      return [];
    }
    return data || [];
  }

  async markAsRead(notificationId: string) {
    const { data, error } = await this.db
      .from('Notification')
      .update({ isRead: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('[NotificationService.markAsRead] error:', error);
      return null;
    }
    return data;
  }

  async markAllAsRead(userId: string) {
    const { data, error } = await this.db
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', userId)
      .eq('isRead', false);

    if (error) {
      console.error('[NotificationService.markAllAsRead] error:', error);
      return false;
    }
    return true;
  }

  async create(userId: string, title: string, body: string, type: string = 'system') {
    const { data, error } = await this.db
      .from('Notification')
      .insert({
        userId,
        title,
        body,
        type,
        isRead: false,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[NotificationService.create] error:', error);
      return null;
    }
    return data;
  }
}
