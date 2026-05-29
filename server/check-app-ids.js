const { Client } = require('pg');
require('dotenv').config();

async function checkAppIds() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  const result = await client.query(`
    SELECT "applicationNumber"
    FROM "LoanApplication"
    ORDER BY "applicationNumber" ASC
  `);
  
  console.log(`Total applications: ${result.rows.length}`);
  console.log('\nCurrent application IDs:');
  result.rows.slice(0, 10).forEach(r => console.log('  -', r.applicationNumber));
  if (result.rows.length > 10) {
    console.log(`  ... and ${result.rows.length - 10} more`);
  }
  
  await client.end();
}

checkAppIds();
