const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL DB.');

    const columns = [
      'CREATE TABLE IF NOT EXISTS "sanctions" ("id" TEXT NOT NULL DEFAULT uuid_generate_v4(), "applicationId" TEXT NOT NULL, "sanctionAmount" DOUBLE PRECISION, "interestRate" DOUBLE PRECISION, "tenure" INTEGER, "sanctionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY ("id"));',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "lanNumber" TEXT;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "lanEnteredAt" TIMESTAMPTZ;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "assignedOfficer" TEXT;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "priority" TEXT;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "fileLoggedAt" TIMESTAMPTZ;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "reviewStartedAt" TIMESTAMPTZ;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "sanctionDate" TIMESTAMPTZ;'
    ];

    for (const sql of columns) {
      try {
        await client.query(sql);
        console.log('Executed:', sql);
      } catch (err) {
        console.error('Error executing:', sql, err.message);
      }
    }

    try {
      await client.query("NOTIFY pgrst, 'reload schema'");
      console.log('Notified PostgREST to reload schema cache.');
    } catch (err) {
      console.error('Notify error:', err.message);
    }
  } catch (e) {
    console.error('Connection failed:', e.message);
  } finally {
    await client.end();
  }
}

run();
