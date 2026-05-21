const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  for (const table of ['BankDecision', 'BankQuery', 'QueryResponse']) {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    console.log(`${table} Columns:`, res.rows.map(r => r.column_name));
  }
  
  await client.end();
}
run();
