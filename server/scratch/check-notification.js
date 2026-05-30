const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  console.log('--- Notification ---');
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Notification'");
  console.log(res.rows);
  
  await client.end();
}
main().catch(console.error);
