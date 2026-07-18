const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL DB.');

    const sqls = [
      // 1. Fix ProcessingFee table (make mode nullable, set id default, add UNIQUE constraint on applicationId)
      'ALTER TABLE "ProcessingFee" ALTER COLUMN "mode" DROP NOT NULL;',
      'ALTER TABLE "ProcessingFee" ADD COLUMN IF NOT EXISTS "id" TEXT DEFAULT uuid_generate_v4();',
      'CREATE UNIQUE INDEX IF NOT EXISTS "idx_processingfee_app_unique" ON "ProcessingFee" ("applicationId");',
      'ALTER TABLE "ProcessingFee" DROP CONSTRAINT IF EXISTS "ProcessingFee_applicationId_key";',
      'ALTER TABLE "ProcessingFee" ADD CONSTRAINT "ProcessingFee_applicationId_key" UNIQUE ("applicationId");',

      // 2. Fix Message table (add messageType column)
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageType" TEXT DEFAULT \'text\';',
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "metadata" JSONB;',

      // 3. Fix LoanApplication table (add approvedAt, rejectedAt, disbursedAt columns)
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMPTZ;',
      'ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "disbursedAt" TIMESTAMPTZ;'
    ];

    for (const sql of sqls) {
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
