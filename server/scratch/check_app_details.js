const { Client } = require('pg');
require('dotenv').config();

async function checkAppDetails() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  
  const result = await client.query(`
    SELECT id, "applicationNumber", "userId", "submittedAt"
    FROM "LoanApplication"
    LIMIT 10
  `);
  
  console.log('Application records in DB:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  await client.end();
}

checkAppDetails().catch(err => {
  console.error(err);
});
