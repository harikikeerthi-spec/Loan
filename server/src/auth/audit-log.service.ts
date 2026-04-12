import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type AppUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: any;
};

@Injectable()
export class AuditLogService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    user: AppUser,
    changes: any,
    request?: any,
  ) {
    try {
      await this.db.from('AuditLog').insert({
        action,
        entityType,
        entityId,
        initiatedBy: user.id,
        changes: changes || {},
        ipAddress: request?.ip || null,
        userAgent: request?.get?.('user-agent') || null,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getEntityLogs(entityType: string, entityId: string, limit: number = 50) {
    const { data } = await this.db
      .from('AuditLog')
      .select('id, action, initiatedBy, changes, createdAt, initiator:User!initiatedBy(firstName, lastName, email)')
      .eq('entityType', entityType)
      .eq('entityId', entityId)
      .order('createdAt', { ascending: false })
      .limit(limit);
    return data || [];
  }

  async getAllLogs(
    entityType?: string,
    initiatedBy?: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    let query = this.db
      .from('AuditLog')
      .select('id, action, entityType, entityId, createdAt, initiator:User!initiatedBy(firstName, lastName, email)')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) query = query.eq('entityType', entityType);
    if (initiatedBy) query = query.eq('initiatedBy', initiatedBy);

    const { data } = await query;
    return data || [];
  }
}
