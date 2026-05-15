-- ============================================================
-- Migration: Add registeredAtIndia column to User table
-- Stores the user's original registration time in India timezone (IST)
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add registeredAtIndia column to User table
-- This stores the UTC time converted to India Standard Time (IST, UTC+5:30)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registeredAtIndia" TEXT DEFAULT NULL;

-- For existing users, populate registeredAtIndia from createdAt
-- This converts the createdAt timestamp to IST format (YYYY-MM-DD HH:MM:SS IST)
UPDATE "User" 
SET "registeredAtIndia" = TO_CHAR(
  ("createdAt" AT TIME ZONE 'Asia/Kolkata'), 
  'YYYY-MM-DD HH24:MI:SS "IST"'
)
WHERE "registeredAtIndia" IS NULL AND "createdAt" IS NOT NULL;

-- Create an index for faster queries on registeredAtIndia if needed
CREATE INDEX IF NOT EXISTS idx_user_registered_at_india ON "User"("registeredAtIndia");

-- Add comment to the column for documentation
COMMENT ON COLUMN "User"."registeredAtIndia" IS 'Original registration time in India Standard Time (IST, UTC+5:30) format: YYYY-MM-DD HH:MM:SS IST';
