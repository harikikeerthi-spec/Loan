const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL DB.');

    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS "conditional_sanctions" (
        "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId" TEXT NOT NULL,
        "conditionsList" JSONB,
        "deadline" TIMESTAMP(3),
        "status" VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );`,
      `CREATE TABLE IF NOT EXISTS "counter_offers" (
        "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId" TEXT NOT NULL,
        "offeredAmount" DOUBLE PRECISION,
        "offeredRate" DOUBLE PRECISION,
        "offeredTenure" INTEGER,
        "status" VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );`,
      `CREATE TABLE IF NOT EXISTS "rejections" (
        "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId" TEXT NOT NULL,
        "reason" TEXT,
        "rejectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id")
      );`
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
        console.log('Executed table creation successfully.');
      } catch (err) {
        console.error('Error executing table creation:', err.message);
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
