const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  console.log('=== Sample LoanApplications and ProcessingFees ===');
  const res = await client.query('SELECT id, status, country, bank FROM "LoanApplication" LIMIT 5');
  console.log('LoanApplications:', res.rows);

  const feeRes = await client.query('SELECT * FROM "ProcessingFee" LIMIT 5');
  console.log('ProcessingFees:', feeRes.rows);

  await client.end();
}

run().catch(console.error);
