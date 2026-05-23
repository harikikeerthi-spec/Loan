import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BankFieldMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const role = user?.role || 'anonymous';

    return next.handle().pipe(
      map((data) => {
        return this.maskData(data, role);
      }),
    );
  }

  private maskData(data: any, role: string): any {
    if (role === 'admin' || role === 'super_admin') {
      return data; // Admins see everything
    }
    return this.maskObject(data, role);
  }

  private maskObject(obj: any, role: string): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskObject(item, role));
    }

    if (typeof obj === 'object') {
      // If it's a Date object, return as-is
      if (obj instanceof Date) {
        return obj;
      }
      
      const keysToMask = this.getMaskKeys(role);
      const newObj = {};
      
      for (const key of Object.keys(obj)) {
        if (keysToMask.includes(key)) {
          continue; // Delete/mask this field
        }
        newObj[key] = this.maskObject(obj[key], role);
      }
      return newObj;
    }

    return obj;
  }

  private getMaskKeys(role: string): string[] {
    const roleNormalized = role.toLowerCase();
    if (roleNormalized === 'staff') {
      return [
        'disbursements',
        'utrNumber',
        'agentCommission',
        'referralFee',
        'creditScore',
        'fileLoggedAt',
        'sanctionConditionsInternal',
      ];
    }
    if (roleNormalized === 'bank' || roleNormalized === 'partner_bank') {
      return [
        'disbursements',
        'agentCommission',
        'referralFee',
        'staffMetrics',
        'revenueData',
      ];
    }
    return [];
  }
}
