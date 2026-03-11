-- CreateTable
CREATE TABLE "OnboardingApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "goal" TEXT,
    "studyDestination" TEXT,
    "courseName" TEXT,
    "targetUniversity" TEXT,
    "intakeSeason" TEXT,
    "bachelorsDegree" TEXT,
    "gpa" DOUBLE PRECISION,
    "workExp" INTEGER,
    "entranceTest" TEXT,
    "entranceScore" TEXT,
    "englishTest" TEXT,
    "englishScore" TEXT,
    "budget" TEXT,
    "pincode" TEXT,
    "loanAmount" TEXT,
    "admitStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT,
    "serviceNotes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'onboarding_bot',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStudyPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT,
    "studyDestination" TEXT,
    "courseName" TEXT,
    "targetUniversity" TEXT,
    "intakeSeason" TEXT,
    "admitStatus" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStudyPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAcademicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bachelorsDegree" TEXT,
    "gpa" DOUBLE PRECISION,
    "workExp" INTEGER,
    "entranceTest" TEXT,
    "entranceScore" TEXT,
    "englishTest" TEXT,
    "englishScore" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAcademicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFinancialProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "budget" TEXT,
    "pincode" TEXT,
    "loanAmount" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFinancialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigilockerConsentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "documentTypes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigilockerConsentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingApplication_userId_key" ON "OnboardingApplication"("userId");

-- CreateIndex
CREATE INDEX "OnboardingApplication_email_idx" ON "OnboardingApplication"("email");

-- CreateIndex
CREATE INDEX "OnboardingApplication_status_idx" ON "OnboardingApplication"("status");

-- CreateIndex
CREATE INDEX "OnboardingApplication_createdAt_idx" ON "OnboardingApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudyPreference_userId_key" ON "UserStudyPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAcademicProfile_userId_key" ON "UserAcademicProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFinancialProfile_userId_key" ON "UserFinancialProfile"("userId");

-- CreateIndex
CREATE INDEX "DigilockerConsentRequest_userId_idx" ON "DigilockerConsentRequest"("userId");

-- CreateIndex
CREATE INDEX "DigilockerConsentRequest_studentEmail_idx" ON "DigilockerConsentRequest"("studentEmail");

-- AddForeignKey
ALTER TABLE "OnboardingApplication" ADD CONSTRAINT "OnboardingApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudyPreference" ADD CONSTRAINT "UserStudyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAcademicProfile" ADD CONSTRAINT "UserAcademicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFinancialProfile" ADD CONSTRAINT "UserFinancialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
