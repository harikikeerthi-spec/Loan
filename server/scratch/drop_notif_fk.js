const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

async function run() {
  const connectionString = env.DIRECT_URL || env.DATABASE_URL;
  const client = new Client({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  console.log("Dropping foreign key constraint on Notification table...");
  const res = await client.query('ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";');
  console.log("Result:", res);
  
  await client.end();
}

run().catch(console.error);
