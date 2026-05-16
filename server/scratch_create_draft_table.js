const { Client } = require('pg');
require('dotenv').config();

async function createTable() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('Creating OnboardingDraft table...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS "OnboardingDraft" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
            "draftData" JSONB NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    // Create index on userId
    await client.query('CREATE INDEX IF NOT EXISTS "idx_onboarding_draft_user_id" ON "OnboardingDraft"("userId")');
    
    console.log('Table created successfully.');
    await client.end();
}
createTable();
