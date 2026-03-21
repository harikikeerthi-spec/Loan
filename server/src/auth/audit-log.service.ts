import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    user: User,
    changes: any,
    request?: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          initiatedBy: user.id,
          changes: changes || {},
          ipAddress: request?.ip || null,
          userAgent: request?.get?.('user-agent') || null,
        },
      });
    } catch (error) {
      // Log errors but don't throw - audit logging should not break the operation
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs for an entity (blog, user, etc.)
   */
  async getEntityLogs(entityType: string, entityId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        action: true,
        initiatedBy: true,
        initiator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        changes: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get all audit logs (super admin only)
   */
  async getAllLogs(
    entityType?: string,
    initiatedBy?: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (initiatedBy) {
      where.initiatedBy = initiatedBy;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        initiator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });
  }
}
