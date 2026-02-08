-- CreateTable
CREATE TABLE "Mentor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "university" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT,
    "loanBank" TEXT NOT NULL,
    "loanAmount" TEXT NOT NULL,
    "loanType" TEXT,
    "interestRate" TEXT,
    "bio" TEXT NOT NULL,
    "expertise" TEXT[],
    "linkedIn" TEXT,
    "image" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentsMentored" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorBooking" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentPhone" TEXT,
    "preferredDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "speaker" TEXT,
    "speakerTitle" TEXT,
    "maxAttendees" INTEGER,
    "attendeesCount" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "recordingUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessStory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "category" TEXT,
    "loanAmount" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "interestRate" TEXT,
    "story" TEXT NOT NULL,
    "tips" TEXT,
    "image" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT,
    "downloadUrl" TEXT,
    "thumbnailUrl" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_email_key" ON "Mentor"("email");

-- CreateIndex
CREATE INDEX "Mentor_country_idx" ON "Mentor"("country");

-- CreateIndex
CREATE INDEX "Mentor_university_idx" ON "Mentor"("university");

-- CreateIndex
CREATE INDEX "Mentor_isActive_idx" ON "Mentor"("isActive");

-- CreateIndex
CREATE INDEX "Mentor_isApproved_idx" ON "Mentor"("isApproved");

-- CreateIndex
CREATE INDEX "Mentor_rating_idx" ON "Mentor"("rating");

-- CreateIndex
CREATE INDEX "MentorBooking_mentorId_idx" ON "MentorBooking"("mentorId");

-- CreateIndex
CREATE INDEX "MentorBooking_status_idx" ON "MentorBooking"("status");

-- CreateIndex
CREATE INDEX "MentorBooking_studentEmail_idx" ON "MentorBooking"("studentEmail");

-- CreateIndex
CREATE INDEX "CommunityEvent_type_idx" ON "CommunityEvent"("type");

-- CreateIndex
CREATE INDEX "CommunityEvent_date_idx" ON "CommunityEvent"("date");

-- CreateIndex
CREATE INDEX "CommunityEvent_isFeatured_idx" ON "CommunityEvent"("isFeatured");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_email_idx" ON "EventRegistration"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email");

-- CreateIndex
CREATE INDEX "SuccessStory_country_idx" ON "SuccessStory"("country");

-- CreateIndex
CREATE INDEX "SuccessStory_category_idx" ON "SuccessStory"("category");

-- CreateIndex
CREATE INDEX "SuccessStory_isApproved_idx" ON "SuccessStory"("isApproved");

-- CreateIndex
CREATE INDEX "SuccessStory_isFeatured_idx" ON "SuccessStory"("isFeatured");

-- CreateIndex
CREATE INDEX "CommunityResource_type_idx" ON "CommunityResource"("type");

-- CreateIndex
CREATE INDEX "CommunityResource_category_idx" ON "CommunityResource"("category");

-- CreateIndex
CREATE INDEX "CommunityResource_downloads_idx" ON "CommunityResource"("downloads");

-- CreateIndex
CREATE INDEX "CommunityResource_isFeatured_idx" ON "CommunityResource"("isFeatured");

-- AddForeignKey
ALTER TABLE "MentorBooking" ADD CONSTRAINT "MentorBooking_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CommunityEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
