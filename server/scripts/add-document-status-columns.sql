-- ============================================================
-- Document Status Migration: Add missing columns to UserDocument
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add rejectionReason column to UserDocument if it doesn't exist
ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Add verifiedAt column to UserDocument if it doesn't exist  
ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMPTZ;

-- Ensure updatedAt column exists with default
ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_user_document_status ON "UserDocument"("status");

-- Create index on userId for faster queries
CREATE INDEX IF NOT EXISTS idx_user_document_user_id ON "UserDocument"("userId");

-- Update existing rows to have current timestamp if updatedAt is NULL
UPDATE "UserDocument" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'UserDocument' 
ORDER BY ordinal_position;
