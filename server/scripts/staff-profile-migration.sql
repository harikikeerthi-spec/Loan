-- ============================================================
-- Staff Portal Feature: DB Migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. StaffProfile — one profile per user, created by staff
CREATE TABLE IF NOT EXISTS "StaffProfile" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "linkedUserId"     TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "assignedStaffId"  TEXT NOT NULL REFERENCES "User"(id),
  "targetBank"       TEXT,
  "loanType"         TEXT,
  "internalNotes"    TEXT,
  "bankStatus"       TEXT NOT NULL DEFAULT 'NOT_SENT',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("linkedUserId")
);

-- 2. StaffProfileDocument — documents attached to a staff profile
--    userDocumentId is nullable (NULL for staff-uploaded docs)
CREATE TABLE IF NOT EXISTS "StaffProfileDocument" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffProfileId"    UUID NOT NULL REFERENCES "StaffProfile"(id) ON DELETE CASCADE,
  "userDocumentId"    TEXT REFERENCES "UserDocument"(id) ON DELETE SET NULL,
  "docType"           TEXT NOT NULL,
  "filePath"          TEXT,
  "originalFilename"  TEXT,
  "source"            TEXT NOT NULL DEFAULT 'USER_UPLOAD',  -- USER_UPLOAD | STAFF_UPLOAD
  "status"            TEXT NOT NULL DEFAULT 'pending',      -- pending | under_review | approved | rejected | requires_resubmission
  "rejectionReason"   TEXT,
  "description"       TEXT,
  "uploadedBy"        TEXT REFERENCES "User"(id),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. StaffProfileShare — share bundles sent to bank staff
CREATE TABLE IF NOT EXISTS "StaffProfileShare" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffProfileId"  UUID NOT NULL REFERENCES "StaffProfile"(id) ON DELETE CASCADE,
  "sharedBy"        TEXT NOT NULL REFERENCES "User"(id),
  "bankName"        TEXT NOT NULL,
  "bankEmail"       TEXT NOT NULL,
  "documentIds"     UUID[],
  "token"           TEXT UNIQUE NOT NULL,
  "expiresAt"       TIMESTAMPTZ NOT NULL,
  "accessNote"      TEXT,
  "accessCount"     INT NOT NULL DEFAULT 0,
  "lastAccessedAt"  TIMESTAMPTZ,
  "revoked"         BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Index for fast lookup by linked user
CREATE INDEX IF NOT EXISTS idx_staff_profile_linked_user ON "StaffProfile"("linkedUserId");
CREATE INDEX IF NOT EXISTS idx_staff_profile_document_profile ON "StaffProfileDocument"("staffProfileId");
CREATE INDEX IF NOT EXISTS idx_staff_profile_share_token ON "StaffProfileShare"("token");

-- 5. Add updatedAt column to UserDocument if it doesn't exist
--    (needed for back-sync)
ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
