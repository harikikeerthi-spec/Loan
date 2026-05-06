const { Client } = require('pg');
require('dotenv').config();

const createTablesSql = `
-- Drop existing tables just in case we need to recreate (be careful in production)
-- DROP TABLE IF EXISTS "Message" CASCADE;
-- DROP TABLE IF EXISTS "Conversation" CASCADE;

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "customerPhone" VARCHAR NOT NULL UNIQUE,
    "status" VARCHAR DEFAULT 'active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "conversationId" UUID REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "senderType" VARCHAR NOT NULL, -- 'customer', 'staff', 'bank', 'system'
    "senderId" VARCHAR, -- phone number or UUID
    "receiverType" VARCHAR, 
    "content" TEXT NOT NULL,
    "messageType" VARCHAR DEFAULT 'text', -- 'text', 'image', 'document'
    "status" VARCHAR DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("conversationId");
`;

async function runMigration() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');
        await client.query(createTablesSql);
        
        // Let's manually trigger indexing by bypassing IF NOT EXISTS via a duplicate try-catch
        try {
             await client.query("CREATE INDEX idx_message_conversation ON \"Message\"(\"conversationId\");");
        } catch(e) { /* ignore index exists */ }

        // Give the service_role and authenticated users access to the new tables
        await client.query('GRANT ALL ON "Conversation" TO service_role, anon, authenticated;');
        await client.query('GRANT ALL ON "Message" TO service_role, anon, authenticated;');

        console.log('Migration successful: Chat tables created.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

runMigration();
