const { Client } = require('pg');
require('dotenv').config();

async function getAppByNumber() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  
  // Find application and user details
  const result = await client.query(`
    SELECT la.*, u."firstName" as u_first, u."lastName" as u_last, u.email as u_email
    FROM "LoanApplication" la
    LEFT JOIN "User" u ON la."userId" = u.id
    WHERE la."applicationNumber" = 'VL-APP-2026-00017'
  `);
  
  console.log('Application matches:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  // If not found with VL- prefix, try matching just the digits
  if (result.rows.length === 0) {
    console.log('No direct match. Searching with wildcard...');
    const result2 = await client.query(`
      SELECT la.*, u."firstName" as u_first, u."lastName" as u_last, u.email as u_email
      FROM "LoanApplication" la
      LEFT JOIN "User" u ON la."userId" = u.id
      WHERE la."applicationNumber" LIKE '%2026-00017%' OR la."applicationNumber" LIKE '%00017%'
    `);
    console.log('Wildcard matches:');
    console.log(JSON.stringify(result2.rows, null, 2));
  }
  
  await client.end();
}

getAppByNumber().catch(err => {
  console.error(err);
});
