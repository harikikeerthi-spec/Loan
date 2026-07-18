const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL DB.');

    const statements = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      'ALTER TABLE "ApplicationNote" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();',
      'ALTER TABLE "ApplicationStatusHistory" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();',
      'ALTER TABLE "BankDecision" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();',
      'ALTER TABLE "ProcessingFee" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();',
      'ALTER TABLE "Disbursement" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();',
      'ALTER TABLE "BankQuery" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();',
      'ALTER TABLE "QueryResponse" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();'
    ];

    for (const sql of statements) {
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
