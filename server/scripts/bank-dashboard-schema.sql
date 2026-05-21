-- Bank Dashboard Schema Migration
-- Adds comprehensive tables for bank portal operations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- BankProduct: Bank-specific loan products
CREATE TABLE IF NOT EXISTS "BankProduct" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "bankId" TEXT NOT NULL,
  "productName" VARCHAR(255) NOT NULL,
  "eligibility" JSONB,
  "maxAmount" DOUBLE PRECISION NOT NULL,
  "minAmount" DOUBLE PRECISION,
  "roiMin" DOUBLE PRECISION NOT NULL,
  "roiMax" DOUBLE PRECISION NOT NULL,
  "processingFee" DOUBLE PRECISION,
  "maxTenure" INTEGER NOT NULL,
  "moratoriumRule" VARCHAR(100),
  "requiredDocs" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- BankBranch: Bank branch information
CREATE TABLE IF NOT EXISTS "BankBranch" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "bankId" TEXT NOT NULL,
  "branchName" VARCHAR(255) NOT NULL,
  "branchCode" VARCHAR(50) NOT NULL,
  "coverageAreas" JSONB,
  "maxCapacity" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- BankDecision: Complete loan decisions (replaces or enhances existing sanctions table)
CREATE TABLE IF NOT EXISTS "BankDecision" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "applicationId" TEXT NOT NULL,
  "bankId" TEXT NOT NULL,
  "decision" VARCHAR(50) NOT NULL,
  "sanctionAmount" DOUBLE PRECISION,
  "interestRate" DOUBLE PRECISION,
  "roiType" VARCHAR(20),
  "tenure" INTEGER,
  "conditions" JSONB,
  "conditionDeadline" TIMESTAMP(3),
  "counterOffer" JSONB,
  "rejectionReason" VARCHAR(255),
  "remarks" TEXT,
  "sanctionLetterUrl" TEXT,
  "sanctionExpiry" TIMESTAMP(3),
  "decidedBy" TEXT NOT NULL,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- ProcessingFee: Track processing fees
CREATE TABLE IF NOT EXISTS "ProcessingFee" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "applicationId" TEXT NOT NULL UNIQUE,
  "lanNumber" VARCHAR(100),
  "feeAmount" DOUBLE PRECISION NOT NULL,
  "gstAmount" DOUBLE PRECISION,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "paymentMode" VARCHAR(50),
  "paymentRef" VARCHAR(255),
  "paidAt" TIMESTAMP(3),
  "waivedBy" TEXT,
  "waiverReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Disbursement: Track disbursement tranches
CREATE TABLE IF NOT EXISTS "Disbursement" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "applicationId" TEXT NOT NULL,
  "trancheNumber" INTEGER NOT NULL DEFAULT 1,
  "amount" DOUBLE PRECISION NOT NULL,
  "mode" VARCHAR(50) NOT NULL,
  "utrNumber" VARCHAR(100),
  "beneficiary" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  "disbursedAt" TIMESTAMP(3) NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedBy" TEXT NOT NULL,
  "nextTrancheDue" TIMESTAMP(3),
  "remainingSanction" DOUBLE PRECISION,
  PRIMARY KEY ("id")
);

-- BankQuery: Query tracking system
CREATE TABLE IF NOT EXISTS "BankQuery" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "applicationId" TEXT NOT NULL,
  "raisedBy" TEXT NOT NULL,
  "queryType" VARCHAR(50) NOT NULL,
  "description" TEXT NOT NULL,
  "requiredDocs" JSONB,
  "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  PRIMARY KEY ("id")
);

-- QueryResponse: Responses to queries
CREATE TABLE IF NOT EXISTS "QueryResponse" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "queryId" TEXT NOT NULL,
  "respondedBy" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "attachments" JSONB,
  "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("queryId") REFERENCES "BankQuery" ("id")
);

-- FileQualityRating: Quality assessment of submitted files
CREATE TABLE IF NOT EXISTS "FileQualityRating" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "applicationId" TEXT NOT NULL UNIQUE,
  "completeness" INTEGER NOT NULL,
  "accuracy" INTEGER NOT NULL,
  "clarity" INTEGER NOT NULL,
  "overall" INTEGER NOT NULL,
  "comments" TEXT,
  "ratedBy" TEXT NOT NULL,
  "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- ConsentRecord: VLCON consent tracking
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "studentId" TEXT NOT NULL,
  "bankId" TEXT NOT NULL,
  "consentId" VARCHAR(50) NOT NULL UNIQUE,
  "scope" VARCHAR(255) NOT NULL,
  "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validTill" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

-- AuditLog: Complete audit trail
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "entityType" VARCHAR(50) NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "performedBy" TEXT NOT NULL,
  "role" VARCHAR(50) NOT NULL,
  "details" JSONB,
  "ipAddress" VARCHAR(50),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- ReferralFee: Track referral commissions
CREATE TABLE IF NOT EXISTS "ReferralFee" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "applicationId" TEXT NOT NULL UNIQUE,
  "bankId" TEXT NOT NULL,
  "feeType" VARCHAR(20) NOT NULL,
  "feeAmount" DOUBLE PRECISION NOT NULL,
  "invoiceStatus" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "invoiceNumber" VARCHAR(100),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Add missing fields to LoanApplication
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "lanNumber" VARCHAR(100) UNIQUE;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "lanEnteredAt" TIMESTAMP(3);
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "fileLoggedBy" TEXT;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "assignedOfficer" TEXT;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "assignedStaffId" TEXT;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "sanctionAmount" DOUBLE PRECISION;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "sanctionDate" TIMESTAMP(3);
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "sanctionExpiry" TIMESTAMP(3);
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "sanctionLetterUrl" TEXT;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "roiType" VARCHAR(20);
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "roiBase" DOUBLE PRECISION;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "roiEffective" DOUBLE PRECISION;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "roiSubsidy" DOUBLE PRECISION;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(50) DEFAULT 'NORMAL';
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "turnaroundDays" INTEGER;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "previousSubmissions" JSONB;
ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "submissionAttempt" INTEGER DEFAULT 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_bankdecision_application" ON "BankDecision"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_bankdecision_bank" ON "BankDecision"("bankId");
CREATE INDEX IF NOT EXISTS "idx_processingfee_application" ON "ProcessingFee"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_disbursement_application" ON "Disbursement"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_bankquery_application" ON "BankQuery"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_auditlog_entity" ON "AuditLog"("entityId", "entityType");
CREATE INDEX IF NOT EXISTS "idx_bankproduct_bank" ON "BankProduct"("bankId");
CREATE INDEX IF NOT EXISTS "idx_bankbranch_bank" ON "BankBranch"("bankId");
CREATE INDEX IF NOT EXISTS "idx_loanapplication_lan" ON "LoanApplication"("lanNumber");
CREATE INDEX IF NOT EXISTS "idx_loanapplication_product" ON "LoanApplication"("productId");
CREATE INDEX IF NOT EXISTS "idx_loanapplication_branch" ON "LoanApplication"("branchId");

COMMIT;
