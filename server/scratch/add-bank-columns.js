const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  console.log('Connected to DB. Adding missing columns...');

  await client.query(`
    ALTER TABLE "LoanApplication"
    ADD COLUMN IF NOT EXISTS "creditScore" INTEGER DEFAULT 750,
    ADD COLUMN IF NOT EXISTS "fileLoggedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS "sanctionConditionsInternal" TEXT,
    ADD COLUMN IF NOT EXISTS "agentCommission" DECIMAL DEFAULT 1500.00,
    ADD COLUMN IF NOT EXISTS "revenueData" TEXT;
  `);

  console.log('Columns added successfully.');
  await client.end();
}
run();
