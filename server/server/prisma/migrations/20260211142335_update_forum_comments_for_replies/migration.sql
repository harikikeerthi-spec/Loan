/*
  Warnings:

  - A unique constraint covering the columns `[applicationNumber]` on the table `LoanApplication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicationNumber` to the `LoanApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommunityEvent" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "ForumComment" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "LoanApplication" ADD COLUMN     "address" TEXT,
ADD COLUMN     "admissionStatus" TEXT,
ADD COLUMN     "annualIncome" DOUBLE PRECISION,
ADD COLUMN     "applicationNumber" TEXT NOT NULL,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "coApplicantEmail" TEXT,
ADD COLUMN     "coApplicantIncome" DOUBLE PRECISION,
ADD COLUMN     "coApplicantName" TEXT,
ADD COLUMN     "coApplicantPhone" TEXT,
ADD COLUMN     "coApplicantRelation" TEXT,
ADD COLUMN     "collateralDetails" TEXT,
ADD COLUMN     "collateralType" TEXT,
ADD COLUMN     "collateralValue" DOUBLE PRECISION,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "courseDuration" INTEGER,
ADD COLUMN     "courseName" TEXT,
ADD COLUMN     "courseStartDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "disbursedAmount" DOUBLE PRECISION,
ADD COLUMN     "disbursedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "employerName" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "estimatedCompletionAt" TIMESTAMP(3),
ADD COLUMN     "fatherEmail" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hasCoApplicant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasCollateral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "interestRate" DOUBLE PRECISION,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "motherEmail" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "motherPhone" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "priorityLevel" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "processingFee" DOUBLE PRECISION,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "reviewStartedAt" TIMESTAMP(3),
ADD COLUMN     "sanctionAmount" DOUBLE PRECISION,
ADD COLUMN     "sanctionedInterestRate" DOUBLE PRECISION,
ADD COLUMN     "stage" TEXT NOT NULL DEFAULT 'application_submitted',
ADD COLUMN     "state" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "tenure" INTEGER,
ADD COLUMN     "universityName" TEXT,
ADD COLUMN     "workExperience" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "expiryDate" TIMESTAMP(3),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "changeReason" TEXT,
    "notes" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_docType_idx" ON "ApplicationDocument"("docType");

-- CreateIndex
CREATE INDEX "ApplicationDocument_status_idx" ON "ApplicationDocument"("status");

-- CreateIndex
CREATE INDEX "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationNote_createdAt_idx" ON "ApplicationNote"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_createdAt_idx" ON "ApplicationStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityEvent_category_idx" ON "CommunityEvent"("category");

-- CreateIndex
CREATE INDEX "ForumComment_parentId_idx" ON "ForumComment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_applicationNumber_key" ON "LoanApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "LoanApplication_applicationNumber_idx" ON "LoanApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "LoanApplication_bank_idx" ON "LoanApplication"("bank");

-- CreateIndex
CREATE INDEX "LoanApplication_loanType_idx" ON "LoanApplication"("loanType");

-- CreateIndex
CREATE INDEX "LoanApplication_stage_idx" ON "LoanApplication"("stage");

-- CreateIndex
CREATE INDEX "LoanApplication_submittedAt_idx" ON "LoanApplication"("submittedAt");

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
