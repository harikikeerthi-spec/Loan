-- ============================================================
-- Add Staff ID Column Migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add staffId column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "staffId" TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_staffid ON "User"("staffId") WHERE "staffId" IS NOT NULL;

-- Create index for finding max sequential staff ID (for generation)
CREATE INDEX IF NOT EXISTS idx_user_staffid_like ON "User"("staffId") WHERE "staffId" LIKE 'VL-SF-%';
