const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  console.log('Connected to DB. Altering BankSubmission constraint...');

  try {
    // 1. Drop the unique constraint
    console.log('Checking unique constraint BankSubmission_applicationId_key...');
    await client.query(`
      ALTER TABLE "BankSubmission" 
      DROP CONSTRAINT IF EXISTS "BankSubmission_applicationId_key"
    `);
    console.log('Successfully dropped BankSubmission_applicationId_key constraint.');

    // 2. Add composite unique constraint on (applicationId, bankId)
    console.log('Creating composite unique constraint on (applicationId, bankId)...');
    await client.query(`
      ALTER TABLE "BankSubmission" 
      ADD CONSTRAINT "BankSubmission_applicationId_bankId_key" UNIQUE ("applicationId", "bankId")
    `);
    console.log('Successfully added composite unique constraint.');

    console.log('Database constraint migration complete.');
  } catch (error) {
    console.error('Error during database constraint migration:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
