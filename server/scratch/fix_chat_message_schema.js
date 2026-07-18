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
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;',
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentType" TEXT;',
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "receiverType" TEXT;',
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageType" TEXT DEFAULT \'text\';',
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "senderName" TEXT;',
      'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "metadata" JSONB;'
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
