const { Client } = require('pg');
require('dotenv').config();

const updateTablesSql = `
-- Add missing columns to Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "customerEmail" VARCHAR;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "customerName" VARCHAR;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- Optional: Add attachment column to Message table for WhatsApp media
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentType" VARCHAR;
`;

async function updateSchema() {
    console.log('Starting schema update...');
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('Successfully connected to database.');
        
        await client.query(updateTablesSql);
        console.log('Columns added successfully.');
        
        // Ensure permissions are correct
        await client.query('GRANT ALL ON "Conversation" TO service_role, anon, authenticated;');
        await client.query('GRANT ALL ON "Message" TO service_role, anon, authenticated;');
        
        console.log('Schema update complete.');
    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        await client.end();
    }
}

updateSchema();
