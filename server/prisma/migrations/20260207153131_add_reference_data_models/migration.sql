-- CreateTable
CREATE TABLE "LoanType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "eligibility" TEXT NOT NULL,
    "documentsRequired" TEXT[],
    "interestRateMin" DOUBLE PRECISION NOT NULL,
    "interestRateMax" DOUBLE PRECISION NOT NULL,
    "loanAmountMin" TEXT NOT NULL,
    "loanAmountMax" TEXT NOT NULL,
    "repaymentPeriod" TEXT NOT NULL,
    "processingTime" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "ranking" INTEGER,
    "worldRanking" INTEGER,
    "type" TEXT NOT NULL,
    "established" INTEGER,
    "website" TEXT,
    "description" TEXT,
    "popularCourses" TEXT[],
    "averageFees" TEXT,
    "acceptanceRate" DOUBLE PRECISION,
    "scholarships" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "imageUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "type" TEXT NOT NULL,
    "loanTypes" TEXT[],
    "educationLoan" BOOLEAN NOT NULL DEFAULT true,
    "interestRateMin" DOUBLE PRECISION NOT NULL,
    "interestRateMax" DOUBLE PRECISION NOT NULL,
    "maxLoanAmount" TEXT NOT NULL,
    "collateralRequired" BOOLEAN NOT NULL,
    "collateralFreeLimit" TEXT,
    "processingFee" TEXT NOT NULL,
    "processingTime" TEXT NOT NULL,
    "features" TEXT[],
    "website" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "popularForStudy" BOOLEAN NOT NULL DEFAULT false,
    "universities" INTEGER NOT NULL DEFAULT 0,
    "averageTuitionFee" TEXT,
    "averageLivingCost" TEXT,
    "studyDuration" TEXT,
    "visaType" TEXT,
    "visaProcessingTime" TEXT,
    "workPermit" BOOLEAN NOT NULL DEFAULT false,
    "postStudyWorkVisa" TEXT,
    "popularCities" TEXT[],
    "currency" TEXT NOT NULL,
    "language" TEXT[],
    "flagUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "eligibleCountries" TEXT[],
    "amount" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "applicationProcess" TEXT NOT NULL,
    "deadline" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT,
    "averageFees" TEXT,
    "popularCountries" TEXT[],
    "careerProspects" TEXT[],
    "averageSalary" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanType_name_key" ON "LoanType"("name");

-- CreateIndex
CREATE INDEX "LoanType_category_idx" ON "LoanType"("category");

-- CreateIndex
CREATE INDEX "LoanType_isPopular_idx" ON "LoanType"("isPopular");

-- CreateIndex
CREATE INDEX "University_country_idx" ON "University"("country");

-- CreateIndex
CREATE INDEX "University_ranking_idx" ON "University"("ranking");

-- CreateIndex
CREATE INDEX "University_isFeatured_idx" ON "University"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "University_name_country_key" ON "University"("name", "country");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");

-- CreateIndex
CREATE INDEX "Bank_country_idx" ON "Bank"("country");

-- CreateIndex
CREATE INDEX "Bank_type_idx" ON "Bank"("type");

-- CreateIndex
CREATE INDEX "Bank_isPopular_idx" ON "Bank"("isPopular");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Country_region_idx" ON "Country"("region");

-- CreateIndex
CREATE INDEX "Country_popularForStudy_idx" ON "Country"("popularForStudy");

-- CreateIndex
CREATE INDEX "Scholarship_country_idx" ON "Scholarship"("country");

-- CreateIndex
CREATE INDEX "Scholarship_isActive_idx" ON "Scholarship"("isActive");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "Course"("level");

-- CreateIndex
CREATE INDEX "Course_field_idx" ON "Course"("field");

-- CreateIndex
CREATE INDEX "Course_isPopular_idx" ON "Course"("isPopular");
