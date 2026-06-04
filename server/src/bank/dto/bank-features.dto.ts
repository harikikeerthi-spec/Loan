// ============================================================================
// BANK FEATURES DTOs
// Covers F17-F46: Schemas, Config, Assignment, Targets, Export, Reports
// ============================================================================

// F37: Bank Schemes
export class CreateBankSchemeDto {
  name: string;
  bank: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  interestRateMin?: number;
  interestRateMax?: number;
  repaymentYearsMin?: number;
  repaymentYearsMax?: number;
  eligibility?: Record<string, any>;
  documentsRequired?: string[];
  processingFee?: number;
  validityStart?: Date;
  validityEnd?: Date;
  visibleTo?: 'all' | 'staff' | 'partners';
}

export class BankSchemeResponseDto extends CreateBankSchemeDto {
  id: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  daysUntilExpiry?: number;
}

// F41: Auto-Assignment Rules
export class CreateAssignmentRuleDto {
  name: string;
  priority?: number;
  ruleType: 'region' | 'amount' | 'course' | 'roundrobin';
  conditions: Record<string, any>;
  assignTo: 'officer' | 'senior_officer' | 'specialist' | 'next_available';
  assignToValue?: string;
  isActive?: boolean;
}

export class AssignmentRuleResponseDto extends CreateAssignmentRuleDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AssignmentLogDto {
  id: number;
  applicationId: string;
  ruleId: number;
  assignedTo: string;
  reason?: string;
  createdAt: Date;
}

// F40: Officer Targets
export class CreateOfficerTargetDto {
  officerId: string; // UUID
  targetMonth: Date;
  targetApplications: number;
  targetAmount: number;
  targetConversions?: number;
  notes?: string;
}

export class OfficerTargetResponseDto extends CreateOfficerTargetDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  achievements?: {
    applicationsProcessed: number;
    amountProcessed: number;
    conversions: number;
    progressPercentage: number;
  };
}

export class CreateRMProfileDto {
  userId: string; // UUID
  region?: string;
  businessVertical?: string;
  portfolio?: Record<string, any>;
  commissionStructure?: Record<string, any>;
}

export class RMProfileResponseDto extends CreateRMProfileDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// F28: Bulk Export
export class CreateExportJobDto {
  jobType: 'applications' | 'users' | 'schemes' | 'reports';
  filters?: Record<string, any>;
  format?: 'csv' | 'excel' | 'pdf';
  columns?: string[];
}

export class ExportJobResponseDto {
  id: string; // UUID
  userId: string;
  jobType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  totalRecords: number;
  processedRecords: number;
  errorMessage?: string;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export class ColumnConfigDto {
  jobType: string;
  selectedColumns: string[];
  isDefault?: boolean;
}

// F38: Scheduled Reports
export class CreateScheduledReportDto {
  name: string;
  reportType: 'daily_summary' | 'weekly_pipeline' | 'monthly_mis';
  frequency: 'daily' | 'weekly' | 'monthly';
  scheduleTime: string; // HH:mm format
  scheduleDay?: string; // for weekly/monthly
  recipients: string[];
  isActive?: boolean;
}

export class ScheduledReportResponseDto extends CreateScheduledReportDto {
  id: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
}

export class ReportRunDto {
  id: number;
  reportId: number;
  status: 'success' | 'failed';
  fileUrl?: string;
  recordsIncluded: number;
  executedAt: Date;
}

// F46: Student Ratings
export class CreateStudentRatingDto {
  studentId: string; // UUID
  applicationId?: string;
  rating: number; // 1-5
  feedback?: string;
  category?: 'cooperation' | 'documentation' | 'communication';
}

export class StudentRatingResponseDto extends CreateStudentRatingDto {
  id: number;
  ratedBy: string;
  createdAt: Date;
}

export class StudentRatingAggregateDto {
  studentId: string;
  avgRating: number;
  totalRatings: number;
  lastUpdated: Date;
}

// F17: Product Config
export class CreateProductConfigDto {
  bankId: string;
  productType: string;
  productName: string;
  description?: string;
  features?: Record<string, any>;
  parameters?: Record<string, any>;
  isActive?: boolean;
}

export class ProductConfigResponseDto extends CreateProductConfigDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// F18: Checklist Config
export class CreateChecklistConfigDto {
  bankId: string;
  productType?: string;
  checklistName: string;
  items: Array<{
    name: string;
    required: boolean;
    conditional: boolean;
  }>;
  displayOrder?: number;
  isActive?: boolean;
}

export class ChecklistConfigResponseDto extends CreateChecklistConfigDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// F19: Branch Config
export class CreateBranchConfigDto {
  branchCode: string;
  branchName: string;
  bankId?: string;
  location?: string;
  region?: string;
  staffCount?: number;
  maxDailyApplications?: number;
  processingCapacity?: number;
  configuration?: Record<string, any>;
  isActive?: boolean;
}

export class BranchConfigResponseDto extends CreateBranchConfigDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// F39: Multi-Branch Statistics
export class BranchStatisticsDto {
  branchCode: string;
  branchName: string;
  applicationsProcessed: number;
  totalAmountProcessed: number;
  conversions: number;
  averageProcessingTime: number; // in days
  staffUtilization: number; // percentage
}

export class MultibranchReportDto {
  reportDate: Date;
  branches: BranchStatisticsDto[];
  totalStatistics: {
    totalApplications: number;
    totalAmount: number;
    totalConversions: number;
    averageConversionRate: number;
  };
}
