const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  console.log('Searching for application with ID or name containing "ABHI"...');
  const appRes = await client.query(`
    SELECT id, "firstName", "lastName", "userId" 
    FROM "LoanApplication" 
    WHERE "firstName" ILIKE '%ABHI%' OR "lastName" ILIKE '%ABHI%'
  `);

  console.log('Applications:', appRes.rows);

  if (appRes.rows.length === 0) {
    console.log('No applications found.');
    await client.end();
    return;
  }

  for (const app of appRes.rows) {
    console.log(`\n=== Documents for App ${app.id} (${app.firstName} ${app.lastName}) ===`);
    
    console.log('--- ApplicationDocument ---');
    const docsRes = await client.query(`
      SELECT id, "docType", "docName", "filePath", status 
      FROM "ApplicationDocument" 
      WHERE "applicationId" = $1
    `, [app.id]);
    console.log(docsRes.rows);

    console.log('--- UserDocument (General Vault) ---');
    const vaultRes = await client.query(`
      SELECT id, "docType", uploaded, "filePath", status 
      FROM "UserDocument" 
      WHERE "userId" = $1
    `, [app.userId]);
    console.log(vaultRes.rows);
  }

  await client.end();
}

run().catch(console.error);
