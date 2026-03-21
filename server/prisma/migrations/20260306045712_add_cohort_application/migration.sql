/*
  Warnings:

  - You are about to drop the column `aiExplanation` on the `ApplicationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `ApplicationDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ApplicationNote` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `disbursedAmount` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `disbursedAt` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `interestRate` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `priorityLevel` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `processingFee` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStartedAt` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `sanctionAmount` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `sanctionedInterestRate` on the `LoanApplication` table. All the data in the column will be lost.
  - You are about to drop the column `passportNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ForumCommentLike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostLike` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `authorId` on table `ApplicationNote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entityId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `initiatedBy` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ForumComment" DROP CONSTRAINT "ForumComment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ForumCommentLike" DROP CONSTRAINT "ForumCommentLike_commentId_fkey";

-- DropForeignKey
ALTER TABLE "ForumCommentLike" DROP CONSTRAINT "ForumCommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "PostLike" DROP CONSTRAINT "PostLike_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostLike" DROP CONSTRAINT "PostLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_referredById_fkey";

-- DropIndex
DROP INDEX "ApplicationDocument_status_idx";

-- DropIndex
DROP INDEX "ApplicationNote_createdAt_idx";

-- DropIndex
DROP INDEX "ApplicationStatusHistory_createdAt_idx";

-- DropIndex
DROP INDEX "LoanApplication_bank_idx";

-- DropIndex
DROP INDEX "LoanApplication_loanType_idx";

-- DropIndex
DROP INDEX "LoanApplication_stage_idx";

-- DropIndex
DROP INDEX "LoanApplication_submittedAt_idx";

-- DropIndex
DROP INDEX "Referral_refereeId_idx";

-- AlterTable
ALTER TABLE "ApplicationDocument" DROP COLUMN "aiExplanation",
DROP COLUMN "expiryDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "uploadedAt" DROP NOT NULL,
ALTER COLUMN "uploadedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ApplicationNote" DROP COLUMN "updatedAt",
ALTER COLUMN "authorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "entityId" SET NOT NULL,
ALTER COLUMN "initiatedBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "LoanApplication" DROP COLUMN "approvedAt",
DROP COLUMN "assignedTo",
DROP COLUMN "disbursedAmount",
DROP COLUMN "disbursedAt",
DROP COLUMN "interestRate",
DROP COLUMN "priorityLevel",
DROP COLUMN "processingFee",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectionReason",
DROP COLUMN "reviewStartedAt",
DROP COLUMN "sanctionAmount",
DROP COLUMN "sanctionedInterestRate",
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "progress" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "reward" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passportNumber",
ADD COLUMN     "admitStatus" TEXT,
ADD COLUMN     "bachelorsDegree" TEXT,
ADD COLUMN     "budget" TEXT,
ADD COLUMN     "courseName" TEXT,
ADD COLUMN     "englishScore" TEXT,
ADD COLUMN     "englishTest" TEXT,
ADD COLUMN     "entranceScore" TEXT,
ADD COLUMN     "entranceTest" TEXT,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "gpa" DOUBLE PRECISION,
ADD COLUMN     "intakeSeason" TEXT,
ADD COLUMN     "loanAmount" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "studyDestination" TEXT,
ADD COLUMN     "targetUniversity" TEXT,
ADD COLUMN     "workExp" INTEGER,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "ForumCommentLike";

-- DropTable
DROP TABLE "PostLike";

-- CreateTable
CREATE TABLE "CohortApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "targetIntake" TEXT NOT NULL,
    "destination" TEXT,
    "university" TEXT,
    "course" TEXT,
    "gapYear" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "source" TEXT DEFAULT 'connectED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CohortApplication_email_idx" ON "CohortApplication"("email");

-- CreateIndex
CREATE INDEX "CohortApplication_status_idx" ON "CohortApplication"("status");

-- CreateIndex
CREATE INDEX "CohortApplication_targetIntake_idx" ON "CohortApplication"("targetIntake");

-- CreateIndex
CREATE INDEX "CohortApplication_createdAt_idx" ON "CohortApplication"("createdAt");

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
