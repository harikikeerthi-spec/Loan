const { Client } = require('pg');
require('dotenv').config();

async function addTrackingColumns() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  console.log('Altering campaign tables to add tracking columns...');

  try {
    // 1. Add tracking columns to EmailCampaign
    await client.query(`
      ALTER TABLE "EmailCampaign" 
      ADD COLUMN IF NOT EXISTS "openCount" INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "clickCount" INT DEFAULT 0;
    `);
    console.log('Added openCount and clickCount to EmailCampaign.');

    // 2. Add tracking columns to CampaignRecipient
    await client.query(`
      ALTER TABLE "CampaignRecipient" 
      ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "clickedAt" TIMESTAMP WITH TIME ZONE;
    `);
    console.log('Added openedAt and clickedAt to CampaignRecipient.');

    console.log('Database tracking schema update complete.');
  } catch (error) {
    console.error('Error adding tracking columns:', error);
  } finally {
    await client.end();
  }
}

addTrackingColumns().catch(console.error);
