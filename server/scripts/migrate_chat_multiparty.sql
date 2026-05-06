-- Enhanced Chat System: Multi-Party Conversations & Document Sharing

-- Update Conversation table to support multiple participants
ALTER TABLE "Conversation" 
ADD COLUMN IF NOT EXISTS "applicationId" UUID REFERENCES "LoanApplication"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "isMultiParty" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "conversationTopic" VARCHAR DEFAULT 'general';

-- Create Conversation_Participant table for tracking who is in which conversation
CREATE TABLE IF NOT EXISTS "Conversation_Participant" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "email" VARCHAR NOT NULL,
    "role" VARCHAR NOT NULL, -- 'customer', 'staff', 'bank', 'admin'
    "fullName" VARCHAR,
    "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "canShare" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    UNIQUE("conversationId", "email", "role")
);

-- Update Message table to track who it's sent to
ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "recipientEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "readBy" JSONB DEFAULT '{}'::JSONB;

-- Create Document_Share table for centralized document tracking
CREATE TABLE IF NOT EXISTS "Document_Share" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "applicationId" UUID REFERENCES "LoanApplication"("id") ON DELETE CASCADE,
    "documentId" UUID NOT NULL,
    "documentName" VARCHAR NOT NULL,
    "documentType" VARCHAR NOT NULL,
    "uploadedBy" VARCHAR NOT NULL, -- email of uploader
    "uploaderRole" VARCHAR NOT NULL, -- 'customer', 'staff', 'bank'
    "sharedWith" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- array of emails
    "sharedWithRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- array of roles
    "status" VARCHAR DEFAULT 'active', -- 'active', 'rejected', 'approved'
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Message_Recipient table for detailed tracking
CREATE TABLE IF NOT EXISTS "Message_Recipient" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "messageId" UUID NOT NULL REFERENCES "Message"("id") ON DELETE CASCADE,
    "recipientEmail" VARCHAR NOT NULL,
    "recipientRole" VARCHAR NOT NULL,
    "readAt" TIMESTAMP WITH TIME ZONE,
    "status" VARCHAR DEFAULT 'delivered', -- 'sent', 'delivered', 'read'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Email_Log table for tracking sent emails
CREATE TABLE IF NOT EXISTS "Email_Log" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "recipientEmail" VARCHAR NOT NULL,
    "subject" VARCHAR NOT NULL,
    "messageId" UUID REFERENCES "Message"("id") ON DELETE SET NULL,
    "documentShareId" UUID REFERENCES "Document_Share"("id") ON DELETE SET NULL,
    "status" VARCHAR DEFAULT 'sent', -- 'pending', 'sent', 'failed'
    "failureReason" TEXT,
    "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS "idx_conv_participant_conversation" ON "Conversation_Participant"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_conv_participant_email" ON "Conversation_Participant"("email");
CREATE INDEX IF NOT EXISTS "idx_conv_participant_role" ON "Conversation_Participant"("role");
CREATE INDEX IF NOT EXISTS "idx_document_share_conversation" ON "Document_Share"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_document_share_application" ON "Document_Share"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_message_recipient_message" ON "Message_Recipient"("messageId");
CREATE INDEX IF NOT EXISTS "idx_message_recipient_email" ON "Message_Recipient"("recipientEmail");
CREATE INDEX IF NOT EXISTS "idx_email_log_recipient" ON "Email_Log"("recipientEmail");

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime 
ADD TABLE "Conversation_Participant",
ADD TABLE "Document_Share",
ADD TABLE "Message_Recipient",
ADD TABLE "Email_Log";
