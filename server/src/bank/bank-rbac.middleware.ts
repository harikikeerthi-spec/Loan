import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from '../supabase/supabase.service';

// ==================== ROLE & PERMISSION DEFINITIONS ====================

interface RolePermissions {
  canRead: string[];
  canWrite: string[];
  canDelete: string[];
  canApprove: string[];
  hiddenFields: string[];
}

const BANK_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  BANK_ADMIN: {
    canRead: ['all'],
    canWrite: ['all'],
    canDelete: ['all'],
    canApprove: ['all'],
    hiddenFields: []
  },
  BANK_OFFICER: {
    canRead: [
      'applications', 'files', 'documents', 'queries', 
      'decisions', 'disbursements', 'auditLogs'
    ],
    canWrite: [
      'queries', 'files', 'documents', 'decisions',
      'disbursements', 'roi', 'processingFee'
    ],
    canDelete: ['queries', 'files'],
    canApprove: ['disbursements', 'decisions'],
    hiddenFields: [
      'agentCommission', 'referralFee', 'staffMetrics',
      'creditScore', 'internalNotes'
    ]
  },
  BANK_VIEWER: {
    canRead: [
      'applications', 'files', 'documents',
      'decisions', 'disbursements', 'auditLogs'
    ],
    canWrite: [],
    canDelete: [],
    canApprove: [],
    hiddenFields: [
      'agentCommission', 'referralFee', 'staffMetrics',
      'creditScore', 'internalNotes', 'processingFee',
      'sanctionAmount', 'roiBase'
    ]
  }
};

@Injectable()
export class BankRbacInterceptor implements NestInterceptor {
  constructor(private readonly supabase: SupabaseService) { }

  private get db() {
    return this.supabase.getClient();
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by StaffGuard/UserGuard

    if (!user) {
      throw new ForbiddenException('Authentication required for bank operations.');
    }

    let role = user.role?.toUpperCase();
    if (role === 'BANK' || role === 'PARTNER_BANK' || role === 'STAFF' || role === 'SUPPORT') {
      role = 'BANK_OFFICER';
    } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      role = 'BANK_ADMIN';
    }
    const email = user.email;
    const method = request.method.toUpperCase();

    // Validate permission for this operation
    await this.validatePermission(role, method, request);

    // 1. Log Data Access in background
    const path = request.url;
    const appId = request.params.id || request.params.applicationId || request.query.applicationId || null;

    if (appId && (role === 'BANK' || role?.startsWith('BANK_'))) {
      await this.logDataAccess(email, appId, `${method} ${path}`, role);
    }

    return next.handle().pipe(
      map(async (data) => {
        const resolvedData = data instanceof Promise ? await data : data;
        return this.processPayload(resolvedData, role, email);
      })
    );
  }

  /**
   * Validates that the user has permission for the requested operation
   */
  private async validatePermission(role: string, method: string, request: any): Promise<void> {
    const permissions = BANK_ROLE_PERMISSIONS[role];

    if (!permissions) {
      throw new ForbiddenException(`Unknown role: ${role}`);
    }

    // Check if read operation
    if (method === 'GET' && permissions.canRead.length === 0) {
      throw new ForbiddenException(`${role} does not have read permissions`);
    }

    // Check if write/post operation
    if (['POST', 'PUT', 'PATCH'].includes(method) && permissions.canWrite.length === 0) {
      throw new ForbiddenException(`${role} does not have write permissions`);
    }

    // Check if delete operation
    if (method === 'DELETE' && permissions.canDelete.length === 0) {
      throw new ForbiddenException(`${role} does not have delete permissions`);
    }
  }

  /**
   * Logs a data access entry into the database.
   */
  private async logDataAccess(userEmail: string, applicationId: string, action: string, role: string) {
    try {
      await this.db.from('AuditLog').insert({
        performedBy: userEmail,
        entityId: applicationId,
        entityType: 'ACCESS',
        action: action,
        role: role,
        createdAt: new Date().toISOString()
      });
      console.log(`[Audit] ${role} ${userEmail} performed: ${action} on App: ${applicationId}`);
    } catch (err) {
      console.error('[Audit] Failed to log access:', err.message);
    }
  }

  /**
   * Evaluates if a student has provided data sharing consent.
   */
  private async checkConsent(userId: string): Promise<boolean> {
    try {
      const { data } = await this.db
        .from('ConsentRecord')
        .select('status')
        .eq('userId', userId)
        .eq('status', 'ACCEPTED')
        .limit(1)
        .maybeSingle();

      return !!data;
    } catch (err) {
      console.error('[Consent Check] Error:', err.message);
      return false;
    }
  }

  /**
   * Masks PII string values
   */
  private maskPII(value: string, maskLength = 4): string {
    if (!value) return '';
    if (value.length <= maskLength) return '*'.repeat(value.length);
    const visiblePart = value.substring(value.length - maskLength);
    return '*'.repeat(value.length - maskLength) + visiblePart;
  }

  /**
   * Recursively filters/masks payload fields depending on user role and consent status.
   */
  private async processPayload(payload: any, role: string, userEmail: string): Promise<any> {
    if (!payload) return payload;

    const permissions = BANK_ROLE_PERMISSIONS[role];
    if (!permissions) return payload;

    // Array Payload processing
    if (Array.isArray(payload)) {
      return Promise.all(payload.map(item => this.processPayload(item, role, userEmail)));
    }

    // Object Payload processing
    if (typeof payload === 'object') {
      const cleaned: any = {};
      const hiddenFields = permissions.hiddenFields;

      for (const [key, value] of Object.entries(payload)) {
        // Exclude fields based on role permissions
        if (hiddenFields.includes(key)) {
          continue;
        }

        // Handle nested arrays or objects
        if (value && (Array.isArray(value) || typeof value === 'object')) {
          cleaned[key] = await this.processPayload(value, role, userEmail);
          continue;
        }

        cleaned[key] = value;
      }

      // Check Consent and Mask PII (e.g., PAN/Aadhaar) if consent is not active
      const studentUserId = payload.userId || payload.studentId;
      if (studentUserId && role === 'BANK_VIEWER') {
        const hasConsent = await this.checkConsent(studentUserId);

        if (!hasConsent) {
          if (cleaned.aadhaar) cleaned.aadhaar = this.maskPII(cleaned.aadhaar, 4);
          if (cleaned.pan) cleaned.pan = this.maskPII(cleaned.pan, 3);
          if (cleaned.email && cleaned.email !== userEmail) cleaned.email = 'masked@bank.com';
          if (cleaned.phone) cleaned.phone = this.maskPII(cleaned.phone, 3);
        }
      }

      return cleaned;
    }

    return payload;
  }
}
