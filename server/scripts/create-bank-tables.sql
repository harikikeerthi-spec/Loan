-- =============================================================================
-- Vidhya Loan – Bank Module Schema
-- Run this in your Supabase SQL Editor (or via supabase db push)
-- All statements are idempotent (IF NOT EXISTS / IF NOT EXISTS guards)
-- =============================================================================

-- ─── 1. BankProduct ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BankProduct" (
  "id"             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "bankId"         TEXT,
  "productName"    TEXT,
  "eligibility"    TEXT,
  "maxAmount"      FLOAT8,
  "minAmount"      FLOAT8,
  "roiMin"         FLOAT8,
  "roiMax"         FLOAT8,
  "processingFee"  FLOAT8,
  "maxTenure"      INT,
  "moratoriumRule" TEXT,
  "requiredDocs"   TEXT,
  "isActive"       BOOLEAN       NOT NULL DEFAULT TRUE,
  "createdAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 2. BankBranch ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BankBranch" (
  "id"             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "bankId"         TEXT,
  "branchName"     TEXT,
  "branchCode"     TEXT,
  "coverageAreas"  TEXT,
  "maxCapacity"    INT
);

-- ─── 3. BankDecision ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BankDecision" (
  "id"                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId"     TEXT,
  "bankId"            TEXT,
  "decision"          TEXT,
  "sanctionAmount"    FLOAT8,
  "interestRate"      FLOAT8,
  "roiType"           TEXT,
  "tenure"            INT,
  "conditions"        TEXT,
  "conditionDeadline" TIMESTAMPTZ,
  "counterOffer"      TEXT,
  "rejectionReason"   TEXT,
  "remarks"           TEXT,
  "sanctionLetterUrl" TEXT,
  "sanctionExpiry"    TIMESTAMPTZ,
  "decidedBy"         TEXT,
  "decidedAt"         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 4. ProcessingFee ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ProcessingFee" (
  "id"            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId" TEXT          UNIQUE,
  "lanNumber"     TEXT,
  "feeAmount"     FLOAT8,
  "gstAmount"     FLOAT8,
  "totalAmount"   FLOAT8,
  "status"        TEXT          NOT NULL DEFAULT 'PENDING',
  "paymentMode"   TEXT,
  "paymentRef"    TEXT,
  "paidAt"        TIMESTAMPTZ,
  "waivedBy"      TEXT,
  "waiverReason"  TEXT,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 5. Disbursement ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Disbursement" (
  "id"                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId"     TEXT,
  "trancheNumber"     INT           NOT NULL DEFAULT 1,
  "amount"            FLOAT8,
  "mode"              TEXT,
  "utrNumber"         TEXT,
  "beneficiary"       TEXT,
  "status"            TEXT          NOT NULL DEFAULT 'CONFIRMED',
  "disbursedAt"       TIMESTAMPTZ,
  "confirmedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "confirmedBy"       TEXT,
  "nextTrancheDue"    TIMESTAMPTZ,
  "remainingSanction" FLOAT8
);

-- ─── 6. BankQuery ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BankQuery" (
  "id"            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId" TEXT,
  "raisedBy"      TEXT,
  "queryType"     TEXT,
  "description"   TEXT,
  "requiredDocs"  TEXT,
  "status"        TEXT          NOT NULL DEFAULT 'OPEN',
  "raisedAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "resolvedAt"    TIMESTAMPTZ
);

-- ─── 7. QueryResponse ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "QueryResponse" (
  "id"           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "queryId"      TEXT,
  "respondedBy"  TEXT,
  "message"      TEXT,
  "attachments"  TEXT,
  "respondedAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 8. FileQualityRating ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FileQualityRating" (
  "id"            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId" TEXT          UNIQUE,
  "completeness"  INT,
  "accuracy"      INT,
  "clarity"       INT,
  "overall"       INT,
  "comments"      TEXT,
  "ratedBy"       TEXT,
  "ratedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 9. ConsentRecord ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
  "id"          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"   TEXT,
  "bankId"      TEXT,
  "consentId"   TEXT          UNIQUE,
  "scope"       TEXT,
  "consentedAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "validTill"   TIMESTAMPTZ
);

-- ─── 10. AuditLog ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "entityType"  TEXT,
  "entityId"    TEXT,
  "action"      TEXT,
  "performedBy" TEXT,
  "role"        TEXT,
  "details"     TEXT,
  "ipAddress"   TEXT,
  "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 11. ReferralFee ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReferralFee" (
  "id"             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId"  TEXT          UNIQUE,
  "bankId"         TEXT,
  "feeType"        TEXT,
  "feeAmount"      FLOAT8,
  "invoiceStatus"  TEXT          NOT NULL DEFAULT 'PENDING',
  "invoiceNumber"  TEXT,
  "paidAt"         TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Extend LoanApplication with new bank-related columns
-- =============================================================================

ALTER TABLE "LoanApplication"
  ADD COLUMN IF NOT EXISTS "lanNumber"           TEXT,
  ADD COLUMN IF NOT EXISTS "lanEnteredAt"        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "fileLoggedBy"        TEXT,
  ADD COLUMN IF NOT EXISTS "productId"           TEXT,
  ADD COLUMN IF NOT EXISTS "branchId"            TEXT,
  ADD COLUMN IF NOT EXISTS "assignedOfficer"     TEXT,
  ADD COLUMN IF NOT EXISTS "assignedStaffId"     TEXT,
  ADD COLUMN IF NOT EXISTS "sanctionAmount"      FLOAT8,
  ADD COLUMN IF NOT EXISTS "sanctionDate"        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sanctionExpiry"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sanctionLetterUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "roiType"             TEXT,
  ADD COLUMN IF NOT EXISTS "roiBase"             FLOAT8,
  ADD COLUMN IF NOT EXISTS "roiEffective"        FLOAT8,
  ADD COLUMN IF NOT EXISTS "roiSubsidy"          FLOAT8,
  ADD COLUMN IF NOT EXISTS "priority"            TEXT    DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "turnaroundDays"      INT,
  ADD COLUMN IF NOT EXISTS "previousSubmissions" TEXT,
  ADD COLUMN IF NOT EXISTS "submissionAttempt"   INT     DEFAULT 1;

-- =============================================================================
-- Useful indexes for common query patterns
-- =============================================================================

CREATE INDEX IF NOT EXISTS "idx_loan_application_lan"
  ON "LoanApplication" ("lanNumber");

CREATE INDEX IF NOT EXISTS "idx_loan_application_status"
  ON "LoanApplication" ("status");

CREATE INDEX IF NOT EXISTS "idx_bank_decision_application"
  ON "BankDecision" ("applicationId");

CREATE INDEX IF NOT EXISTS "idx_disbursement_application"
  ON "Disbursement" ("applicationId");

CREATE INDEX IF NOT EXISTS "idx_bank_query_application"
  ON "BankQuery" ("applicationId");

CREATE INDEX IF NOT EXISTS "idx_audit_log_performed_by"
  ON "AuditLog" ("performedBy");

CREATE INDEX IF NOT EXISTS "idx_audit_log_entity"
  ON "AuditLog" ("entityType", "entityId");
