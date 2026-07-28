-- SQL Migration script to create the ApplyLoan table in Supabase PostgreSQL database
-- Run this script in the Supabase SQL Editor if you want to enable the separate ApplyLoan table for leads

CREATE TABLE IF NOT EXISTS public."ApplyLoan" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "applicationNumber" TEXT,
  "bank" TEXT,
  "loanType" TEXT,
  "amount" DOUBLE PRECISION,
  "courseType" TEXT,
  "country" TEXT,
  "university" TEXT,
  "annualFee" DOUBLE PRECISION,
  "livingCost" DOUBLE PRECISION,
  "coApplicant" TEXT,
  "income" DOUBLE PRECISION,
  "collateral" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "dateOfBirth" TEXT,
  "address" TEXT,
  "pincode" TEXT,
  "notes" TEXT,
  "admissionStatus" TEXT,
  "intakeSeason" TEXT,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Index for efficient sorting and querying
CREATE INDEX IF NOT EXISTS "idx_ApplyLoan_createdAt" ON public."ApplyLoan" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_ApplyLoan_userId" ON public."ApplyLoan" ("userId");
