const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  await client.connect();
  const res = await client.query(`
    SELECT * FROM "BankPriority"
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
check();
