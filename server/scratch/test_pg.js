require('dotenv').config();
const { Client } = require('pg');

async function testPg() {
  console.log('Connecting to Postgres direct URL...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const startConnect = Date.now();
  await client.connect();
  console.log(`Connected in ${Date.now() - startConnect} ms`);

  const startQuery = Date.now();
  const res = await client.query('SELECT count(*) FROM "Blog"');
  console.log(`Query finished in ${Date.now() - startQuery} ms:`, res.rows[0]);

  await client.end();
}

testPg().catch(console.error);
