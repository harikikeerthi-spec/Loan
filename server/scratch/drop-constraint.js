const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to DB. Dropping constraints...');
  try {
    await client.query('ALTER TABLE "LoanApplication" DROP CONSTRAINT IF EXISTS "LoanApplication_lanNumber_key" CASCADE;');
    console.log('Dropped constraint LoanApplication_lanNumber_key.');
    await client.query('DROP INDEX IF EXISTS "LoanApplication_lanNumber_key" CASCADE;');
    console.log('Dropped index LoanApplication_lanNumber_key.');

    await client.query('ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_staffId_key" CASCADE;');
    console.log('Dropped constraint User_staffId_key.');
    await client.query('DROP INDEX IF EXISTS "User_staffId_key" CASCADE;');
    console.log('Dropped index User_staffId_key.');

    await client.query('ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "Referral_referrerId_refereeEmail_key" CASCADE;');
    console.log('Dropped constraint Referral_referrerId_refereeEmail_key.');
    await client.query('DROP INDEX IF EXISTS "Referral_referrerId_refereeEmail_key" CASCADE;');
    console.log('Dropped index Referral_referrerId_refereeEmail_key.');
  } catch (err) {
    console.error('Error dropping constraint:', err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
