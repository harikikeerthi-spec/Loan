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

@Injectable()
export class BankRbacInterceptor implements NestInterceptor {
  constructor(private readonly supabase: SupabaseService) {}

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

    const role = user.role?.toLowerCase();
    const email = user.email;

    // 1. Log Data Access in background
    const path = request.url;
    const method = request.method;
    
    // Extract application/student ID if present in query or params
    const appId = request.params.id || request.params.applicationId || request.query.applicationId || null;

    if (appId && role === 'bank') {
      await this.logDataAccess(email, appId, `Viewed application via ${method} ${path}`);
    }

    return next.handle().pipe(
      map(async (data) => {
        // Resolve promise if async mapper returns promise
        const resolvedData = data instanceof Promise ? await data : data;
        return this.processPayload(resolvedData, role, email);
      })
    );
  }

  /**
   * Logs a data access entry into the database.
   */
  private async logDataAccess(userEmail: string, applicationId: string, action: string) {
    try {
      await this.db.from('data_access_logs').insert({
        accessedBy: userEmail,
        applicationId: applicationId,
        action: action,
        accessedAt: new Date().toISOString()
      });
      console.log(`[Audit Log] User ${userEmail} performed action: "${action}" on App ID: ${applicationId}`);
    } catch (err) {
      console.error('[Audit Log] Failed to insert data_access_logs:', err.message);
    }
  }

  /**
   * Evaluates if a student has provided data sharing consent.
   */
  private async checkConsent(userId: string): Promise<boolean> {
    try {
      const { data } = await this.db
        .from('consent_records')
        .select('status')
        .eq('userId', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      
      return !!data;
    } catch (err) {
      console.error('[Consent Check] Error checking consent:', err.message);
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

    // Array Payload processing
    if (Array.isArray(payload)) {
      return Promise.all(payload.map(item => this.processPayload(item, role, userEmail)));
    }

    // Object Payload processing
    if (typeof payload === 'object') {
      const isBank = role === 'bank' || role === 'partner_bank';
      const isStaff = role === 'staff';

      const cleaned: any = {};

      for (const [key, value] of Object.entries(payload)) {
        // Enforce Multi-tenant isolation: Bank must never see financial details belonging to agent payouts
        if (isBank) {
          if (['commissionAmount', 'agentCommission', 'referralFee', 'referralFeeAmount'].includes(key)) {
            continue; // Strips fields entirely
          }
          if (key === 'utrNumber' || key === 'disbursementUtr') {
            cleaned[key] = 'UTR details restricted at partner node';
            continue;
          }
        }

        // Staff must never see internal bank sanction conditions
        if (isStaff) {
          if (['internalConditions', 'bankReviewRemarks', 'officerChecklist'].includes(key)) {
            continue;
          }
        }

        // Handle nested arrays or objects
        if (value && (Array.isArray(value) || typeof value === 'object')) {
          cleaned[key] = await this.processPayload(value, role, userEmail);
          continue;
        }

        cleaned[key] = value;
      }

      // Check Consent and Mask PII (e.g., PAN/Aadhaar)
      const studentUserId = payload.userId || payload.studentId;
      if (studentUserId) {
        const hasConsent = await this.checkConsent(studentUserId);
        
        if (!hasConsent) {
          // If no active consent, mask student identifier details
          if (cleaned.aadhaar) cleaned.aadhaar = this.maskPII(cleaned.aadhaar, 4);
          if (cleaned.pan) cleaned.pan = this.maskPII(cleaned.pan, 3);
          if (cleaned.email && cleaned.email !== userEmail) cleaned.email = 'masked_student_contact@vidyaloans.com';
          if (cleaned.phone) cleaned.phone = this.maskPII(cleaned.phone, 3);
        }
      }

      return cleaned;
    }

    return payload;
  }
}
