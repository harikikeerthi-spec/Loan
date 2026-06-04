const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📦 Adding status and rejectionReason columns to User table...');
    await client.query(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
    `);
    console.log('✅ Columns added successfully.');

    // Set existing users to active so their status is valid
    console.log('📦 Setting existing users status to active...');
    await client.query(`
      UPDATE "User" SET "status" = 'active' WHERE "status" IS NULL;
    `);
    console.log('✅ Existing users updated.');

    console.log('🎉 Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
