const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
  });

  await client.connect();
  console.log('Connected to database for Chat and ReviewStartedAt migrations...');

  try {
    // 1. Add reviewStartedAt to LoanApplication table
    console.log('Adding reviewStartedAt column to LoanApplication table...');
    await client.query(`
      ALTER TABLE "LoanApplication" 
      ADD COLUMN IF NOT EXISTS "reviewStartedAt" TIMESTAMP(3);
    `);
    console.log('✓ reviewStartedAt column updated/exists.');

    // 2. Create Conversation table
    console.log('Creating Conversation table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Conversation" (
          "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          "customerPhone" VARCHAR(100) NOT NULL,
          "status" VARCHAR(50) DEFAULT 'active',
          "customerEmail" VARCHAR(255),
          "customerName" VARCHAR(255),
          "metadata" JSONB DEFAULT '{}'::JSONB,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Conversation table created/exists.');

    // 3. Create Message table
    console.log('Creating Message table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Message" (
          "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
          "content" TEXT NOT NULL,
          "senderType" VARCHAR(50) NOT NULL,
          "senderId" VARCHAR(255) NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "status" VARCHAR(50) DEFAULT 'sent'
      );
    `);
    console.log('✓ Message table created/exists.');

    // 4. Run multiparty chat tables and updates
    console.log('Running migrate_chat_multiparty DDL...');
    
    // ALTERs on Conversation
    await client.query(`
      ALTER TABLE "Conversation" 
      ADD COLUMN IF NOT EXISTS "applicationId" TEXT REFERENCES "LoanApplication"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "isMultiParty" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "conversationTopic" VARCHAR DEFAULT 'general';
    `);

    // CREATE Conversation_Participant
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Conversation_Participant" (
          "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
          "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
          "email" VARCHAR NOT NULL,
          "role" VARCHAR NOT NULL,
          "fullName" VARCHAR,
          "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "canShare" BOOLEAN DEFAULT true,
          "isActive" BOOLEAN DEFAULT true,
          UNIQUE("conversationId", "email", "role")
      );
    `);

    // ALTERs on Message
    await client.query(`
      ALTER TABLE "Message"
      ADD COLUMN IF NOT EXISTS "recipientEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN IF NOT EXISTS "readBy" JSONB DEFAULT '{}'::JSONB;
    `);

    // CREATE Document_Share
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Document_Share" (
          "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
          "applicationId" TEXT REFERENCES "LoanApplication"("id") ON DELETE CASCADE,
          "documentId" UUID NOT NULL,
          "documentName" VARCHAR NOT NULL,
          "documentType" VARCHAR NOT NULL,
          "uploadedBy" VARCHAR NOT NULL,
          "uploaderRole" VARCHAR NOT NULL,
          "sharedWith" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "sharedWithRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "status" VARCHAR DEFAULT 'active',
          "reviewNotes" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // CREATE Message_Recipient
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Message_Recipient" (
          "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          "messageId" UUID NOT NULL REFERENCES "Message"("id") ON DELETE CASCADE,
          "recipientEmail" VARCHAR NOT NULL,
          "recipientRole" VARCHAR NOT NULL,
          "readAt" TIMESTAMP WITH TIME ZONE,
          "status" VARCHAR DEFAULT 'delivered',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // CREATE Email_Log
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Email_Log" (
          "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          "recipientEmail" VARCHAR NOT NULL,
          "subject" VARCHAR NOT NULL,
          "messageId" UUID REFERENCES "Message"("id") ON DELETE SET NULL,
          "documentShareId" UUID REFERENCES "Document_Share"("id") ON DELETE SET NULL,
          "status" VARCHAR DEFAULT 'sent',
          "failureReason" TEXT,
          "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indices
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_conv_participant_conversation" ON "Conversation_Participant"("conversationId");
      CREATE INDEX IF NOT EXISTS "idx_conv_participant_email" ON "Conversation_Participant"("email");
      CREATE INDEX IF NOT EXISTS "idx_conv_participant_role" ON "Conversation_Participant"("role");
      CREATE INDEX IF NOT EXISTS "idx_document_share_conversation" ON "Document_Share"("conversationId");
      CREATE INDEX IF NOT EXISTS "idx_document_share_application" ON "Document_Share"("applicationId");
      CREATE INDEX IF NOT EXISTS "idx_message_recipient_message" ON "Message_Recipient"("messageId");
      CREATE INDEX IF NOT EXISTS "idx_message_recipient_email" ON "Message_Recipient"("recipientEmail");
      CREATE INDEX IF NOT EXISTS "idx_email_log_recipient" ON "Email_Log"("recipientEmail");
    `);

    console.log('✓ Multi-party chat tables and indexes verified/created.');

    // Enable realtime (in try-catch because ALTER PUBLICATION may throw if not superuser or publication missing)
    try {
      await client.query(`
        ALTER PUBLICATION supabase_realtime 
        ADD TABLE "Conversation_Participant",
        ADD TABLE "Document_Share",
        ADD TABLE "Message_Recipient",
        ADD TABLE "Email_Log";
      `);
      console.log('✓ Realtime enabled on tables.');
    } catch (e) {
      console.log('• Note: Realtime tables could not be altered (often due to privileges, ignoring):', e.message);
    }

    // 5. Reload PostgREST Cache
    console.log('Sending reload notification to PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✓ Reload notification sent successfully.');

    console.log('\n🎉 ALL SCHEMA MIGRATIONS AND CACHE RELOAD EXECUTED SUCCESSFULLY!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
