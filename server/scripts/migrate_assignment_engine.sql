-- ============================================================
-- VidyaLoans: Loan Assignment Engine Migration
-- Date: 2026-08-04
-- Description: Adds all tables, columns, and RPC functions
--              required by the Loan Assignment Engine.
-- Run this script once in Supabase SQL Editor.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Extend LoanApplication with assignment fields
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "LoanApplication"
  ADD COLUMN IF NOT EXISTS "assignedStaffId"   TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt"        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "assignmentStatus"  TEXT DEFAULT 'unassigned',
  ADD COLUMN IF NOT EXISTS "priority"          TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS "lockedAt"          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "lockedByStaffId"   TEXT,
  ADD COLUMN IF NOT EXISTS "lastActivityAt"    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_loan_assigned_staff    ON "LoanApplication"("assignedStaffId");
CREATE INDEX IF NOT EXISTS idx_loan_assignment_status ON "LoanApplication"("assignmentStatus");
CREATE INDEX IF NOT EXISTS idx_loan_priority          ON "LoanApplication"("priority");
CREATE INDEX IF NOT EXISTS idx_loan_last_activity     ON "LoanApplication"("lastActivityAt");

-- ─────────────────────────────────────────────────────────────
-- 2. Create StaffProfile table if not exists & extend fields
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "StaffProfile" (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "linkedUserId"    TEXT UNIQUE,
  email             TEXT,
  "isAvailable"     BOOLEAN DEFAULT TRUE,
  "isOnLeave"       BOOLEAN DEFAULT FALSE,
  "currentWorkload" INT DEFAULT 0,
  "maxWorkload"     INT DEFAULT 20,
  specialization    TEXT[],
  "staffRole"       TEXT DEFAULT 'loan_officer',
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "StaffProfile"
  ADD COLUMN IF NOT EXISTS "isAvailable"     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "isOnLeave"       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "currentWorkload" INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxWorkload"     INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS "specialization"  TEXT[],
  ADD COLUMN IF NOT EXISTS "staffRole"       TEXT DEFAULT 'loan_officer';

-- ─────────────────────────────────────────────────────────────
-- 3. Create AssignmentTracker table (single-row per scope)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AssignmentTracker" (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  scope                 TEXT NOT NULL DEFAULT 'global',
  "lastAssignedStaffId" TEXT,
  "updatedAt"           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scope)
);

INSERT INTO "AssignmentTracker" (scope)
VALUES ('global')
ON CONFLICT (scope) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. Create LoanAssignmentHistory table (full audit trail)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LoanAssignmentHistory" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "applicationId" TEXT NOT NULL,
  "fromStaffId"   TEXT,
  "toStaffId"     TEXT NOT NULL,
  "assignedBy"    TEXT NOT NULL,
  reason          TEXT,
  "createdAt"     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_history_app   ON "LoanAssignmentHistory"("applicationId");
CREATE INDEX IF NOT EXISTS idx_assignment_history_staff ON "LoanAssignmentHistory"("toStaffId");
CREATE INDEX IF NOT EXISTS idx_assignment_history_date  ON "LoanAssignmentHistory"("createdAt");

-- ─────────────────────────────────────────────────────────────
-- 5. RPC: assign_loan_atomic  (row-locked, no double assignment)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_loan_atomic(
  p_loan_id     TEXT,
  p_staff_id    TEXT,
  p_assigned_by TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE v_loan RECORD;
BEGIN
  SELECT * INTO v_loan FROM "LoanApplication"
  WHERE id = p_loan_id FOR UPDATE;

  IF v_loan."assignedStaffId" IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_assigned',
      'assignedStaffId', v_loan."assignedStaffId"
    );
  END IF;

  UPDATE "LoanApplication" SET
    "assignedStaffId"  = p_staff_id,
    "assignedAt"       = now(),
    "assignmentStatus" = 'assigned',
    "lastActivityAt"   = now()
  WHERE id = p_loan_id;

  UPDATE "StaffProfile"
  SET "currentWorkload" = COALESCE("currentWorkload", 0) + 1
  WHERE "linkedUserId" = p_staff_id OR id = p_staff_id;

  INSERT INTO "LoanAssignmentHistory"
    ("applicationId", "fromStaffId", "toStaffId", "assignedBy", reason)
  VALUES
    (p_loan_id, NULL, p_staff_id, p_assigned_by, 'round_robin');

  RETURN jsonb_build_object('success', true, 'assignedStaffId', p_staff_id);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. RPC: reassign_loan_atomic  (manual or inactivity)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reassign_loan_atomic(
  p_loan_id      TEXT,
  p_new_staff_id TEXT,
  p_assigned_by  TEXT DEFAULT 'system',
  p_reason       TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE v_loan RECORD;
BEGIN
  SELECT * INTO v_loan FROM "LoanApplication"
  WHERE id = p_loan_id FOR UPDATE;

  IF v_loan."assignedStaffId" IS NOT NULL THEN
    UPDATE "StaffProfile"
    SET "currentWorkload" = GREATEST(COALESCE("currentWorkload", 1) - 1, 0)
    WHERE "linkedUserId" = v_loan."assignedStaffId" OR id = v_loan."assignedStaffId";
  END IF;

  UPDATE "LoanApplication" SET
    "assignedStaffId"  = p_new_staff_id,
    "assignedAt"       = now(),
    "assignmentStatus" = 'assigned',
    "lastActivityAt"   = now()
  WHERE id = p_loan_id;

  UPDATE "StaffProfile"
  SET "currentWorkload" = COALESCE("currentWorkload", 0) + 1
  WHERE "linkedUserId" = p_new_staff_id OR id = p_new_staff_id;

  INSERT INTO "LoanAssignmentHistory"
    ("applicationId", "fromStaffId", "toStaffId", "assignedBy", reason)
  VALUES
    (p_loan_id, v_loan."assignedStaffId", p_new_staff_id, p_assigned_by, p_reason);

  RETURN jsonb_build_object(
    'success', true,
    'fromStaffId', v_loan."assignedStaffId",
    'toStaffId', p_new_staff_id
  );
END;
$$;
