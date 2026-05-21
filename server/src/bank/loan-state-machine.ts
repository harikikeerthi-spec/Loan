import { BadRequestException } from '@nestjs/common';

export type LoanStatus =
  | 'pending'
  | 'docs_received'
  | 'staff_verified'
  | 'submitted_to_bank'
  | 'file_logged'
  | 'under_bank_review'
  | 'query_raised'
  | 'approved'
  | 'sanctioned'
  | 'conditional_sanction'
  | 'counter_offer'
  | 'rejected'
  | 'disbursement_confirmed'
  | 'closed'
  | 'expired';

export interface StateTransition {
  from: LoanStatus[];
  to: LoanStatus;
  allowedRoles: string[];
}

export class LoanStateMachine {
  private static readonly transitions: StateTransition[] = [
    {
      from: ['pending'],
      to: 'docs_received',
      allowedRoles: ['staff', 'admin', 'super_admin']
    },
    {
      from: ['docs_received', 'pending'],
      to: 'staff_verified',
      allowedRoles: ['staff', 'admin', 'super_admin']
    },
    {
      from: ['staff_verified'],
      to: 'submitted_to_bank',
      allowedRoles: ['staff', 'admin', 'super_admin']
    },
    {
      from: ['submitted_to_bank'],
      to: 'file_logged',
      allowedRoles: ['bank', 'partner_bank', 'staff', 'admin', 'super_admin']
    },
    {
      from: ['file_logged', 'submitted_to_bank'],
      to: 'under_bank_review',
      allowedRoles: ['bank', 'partner_bank', 'staff', 'admin', 'super_admin']
    },
    {
      from: ['under_bank_review', 'file_logged'],
      to: 'query_raised',
      allowedRoles: ['bank', 'partner_bank', 'staff', 'admin', 'super_admin']
    },
    {
      from: ['query_raised'],
      to: 'under_bank_review',
      allowedRoles: ['staff', 'admin', 'super_admin', 'bank', 'partner_bank']
    },
    {
      from: ['under_bank_review', 'file_logged', 'query_raised'],
      to: 'approved',
      allowedRoles: ['bank', 'partner_bank', 'admin', 'super_admin']
    },
    {
      from: ['under_bank_review', 'file_logged', 'query_raised', 'approved'],
      to: 'sanctioned',
      allowedRoles: ['bank', 'partner_bank', 'admin', 'super_admin']
    },
    {
      from: ['under_bank_review', 'file_logged', 'query_raised'],
      to: 'conditional_sanction',
      allowedRoles: ['bank', 'partner_bank', 'admin', 'super_admin']
    },
    {
      from: ['under_bank_review', 'file_logged', 'query_raised'],
      to: 'counter_offer',
      allowedRoles: ['bank', 'partner_bank', 'admin', 'super_admin']
    },
    {
      from: ['under_bank_review', 'file_logged', 'query_raised', 'conditional_sanction', 'counter_offer'],
      to: 'rejected',
      allowedRoles: ['bank', 'partner_bank', 'admin', 'super_admin']
    },
    {
      from: ['approved', 'sanctioned', 'conditional_sanction', 'counter_offer'],
      to: 'disbursement_confirmed',
      allowedRoles: ['bank', 'partner_bank', 'admin', 'super_admin']
    },
    {
      from: ['disbursement_confirmed'],
      to: 'closed',
      allowedRoles: ['admin', 'super_admin', 'staff']
    },
    {
      from: ['approved', 'sanctioned', 'conditional_sanction', 'counter_offer', 'under_bank_review', 'file_logged'],
      to: 'expired',
      allowedRoles: ['system', 'admin', 'super_admin']
    }
  ];

  /**
   * Validates a state transition and role access.
   * Throws BadRequestException if transition is invalid.
   */
  static validateTransition(
    currentStatus: string,
    targetStatus: string,
    userRole: string
  ): void {
    const fromStatus = (currentStatus?.toLowerCase() || 'pending') as LoanStatus;
    const toStatus = (targetStatus?.toLowerCase()) as LoanStatus;
    const role = userRole?.toLowerCase();

    // Find valid transition configuration
    const transition = this.transitions.find(
      t => t.to.toLowerCase() === toStatus && t.from.includes(fromStatus)
    );

    if (!transition) {
      throw new BadRequestException(
        `Invalid lifecycle transition: Cannot move loan application from "${fromStatus.toUpperCase()}" to "${toStatus.toUpperCase()}"`
      );
    }

    // Bypass check for super admins or system cron jobs
    if (role === 'super_admin' || role === 'system') {
      return;
    }

    // Verify role has permissions for this transition
    const isRoleAllowed = transition.allowedRoles.some(
      r => r.toLowerCase() === role || (r === 'partner_bank' && role === 'bank')
    );

    if (!isRoleAllowed) {
      throw new BadRequestException(
        `Unauthorized action: Role "${userRole}" is not permitted to advance status to "${targetStatus.toUpperCase()}"`
      );
    }
  }

  /**
   * Helper to get progress percentage by status
   */
  static getProgressByStatus(status: string): number {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending': return 10;
      case 'docs_received': return 25;
      case 'staff_verified': return 40;
      case 'submitted_to_bank': return 50;
      case 'file_logged': return 60;
      case 'under_bank_review': return 70;
      case 'query_raised': return 75;
      case 'conditional_sanction': return 80;
      case 'counter_offer': return 80;
      case 'approved': return 85;
      case 'sanctioned': return 90;
      case 'disbursement_confirmed': return 95;
      case 'closed': return 100;
      default: return 10;
    }
  }

  /**
   * Helper to get pipeline stage label by status
   */
  static getStageByStatus(status: string): string {
    const s = status?.toLowerCase();
    if (['pending', 'docs_received'].includes(s)) return 'Pre-login';
    if (['staff_verified', 'submitted_to_bank'].includes(s)) return 'Submitted';
    if (['file_logged', 'under_bank_review', 'query_raised'].includes(s)) return 'Verification';
    if (['conditional_sanction', 'counter_offer', 'approved', 'sanctioned'].includes(s)) return 'Sanctioned';
    if (['disbursement_confirmed', 'closed'].includes(s)) return 'Disbursed';
    return 'Pre-login';
  }
}
