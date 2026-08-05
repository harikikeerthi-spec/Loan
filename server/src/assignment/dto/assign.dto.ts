export class ReassignLoanDto {
  toStaffId: string;
  reason?: string;
}

export class BulkReassignDto {
  loanIds: string[];
  toStaffId: string;
  reason?: string;
}

export class LockApplicationDto {
  staffId: string;
}

export class UpdateStaffAvailabilityDto {
  isAvailable?: boolean;
  isOnLeave?: boolean;
  maxWorkload?: number;
  specialization?: string[];
}

