const { Client } = require('pg');
require('dotenv').config();

async function checkOldIds() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  const result = await client.query(`
    SELECT DISTINCT "applicationNumber"
    FROM "LoanApplication"
    WHERE "applicationNumber" NOT LIKE 'VL-APP-%'
    LIMIT 20
  `);
  
  console.log('Old application ID formats:');
  result.rows.forEach(r => console.log('  -', r.applicationNumber));
  
  await client.end();
}

checkOldIds();
