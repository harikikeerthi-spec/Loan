const { Client } = require('pg');
require('dotenv').config();

async function createCampaignTables() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  console.log('Creating tables in database...');

  try {
    // 1. Create EmailCampaign table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "EmailCampaign" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        "templateType" VARCHAR(50) NOT NULL,
        tone VARCHAR(50) NOT NULL,
        "optimizationGoal" TEXT,
        "primaryObjective" TEXT NOT NULL,
        "targetContext" TEXT,
        subject VARCHAR(255) NOT NULL,
        "bodyTemplate" TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        priority VARCHAR(50) DEFAULT 'medium',
        "scheduledAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "totalCount" INT DEFAULT 0,
        "sentCount" INT DEFAULT 0,
        "failedCount" INT DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('EmailCampaign table created/exists.');

    // 2. Create CampaignRecipient table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "CampaignRecipient" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaignId" UUID REFERENCES "EmailCampaign"(id) ON DELETE CASCADE,
        "recipientEmail" VARCHAR(255) NOT NULL,
        "recipientName" VARCHAR(255),
        variables JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'pending',
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('CampaignRecipient table created/exists.');

    // 3. Create Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_status_schedule ON "EmailCampaign"(status, "scheduledAt");
      CREATE INDEX IF NOT EXISTS idx_recipient_campaign_status ON "CampaignRecipient"("campaignId", status);
    `);
    console.log('Indexes created successfully.');

    console.log('Database tables setup complete.');
  } catch (error) {
    console.error('Error creating campaign tables:', error);
  } finally {
    await client.end();
  }
}

createCampaignTables().catch(console.error);
