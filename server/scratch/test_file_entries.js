const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log('--- Checking LoanApplication and FileEntry for Avanse & Poonawalla ---');

    // 1. Check all applications with bank name containing Avanse or Poonawalla
    const appsRes = await client.query(`
        SELECT id, bank, status, "lanNumber" 
        FROM "LoanApplication" 
        WHERE bank ILIKE '%Avanse%' OR bank ILIKE '%Poonawalla%'
    `);
    console.log(`\nFound ${appsRes.rows.length} applications in LoanApplication:`);
    console.log(appsRes.rows);

    // 2. Check all entries in FileEntry for bankId 'avanse' or 'poonawalla'
    const filesRes = await client.query(`
        SELECT id, "applicationId", "bankId", "fileName", status 
        FROM "FileEntry" 
        WHERE "bankId" IN ('avanse', 'poonawalla')
    `);
    console.log(`\nFound ${filesRes.rows.length} entries in FileEntry:`);
    console.log(filesRes.rows);

    // 3. For any matching application, show if it is matched in FileEntry
    console.log('\nMatch Details:');
    for (const app of appsRes.rows) {
        const fileMatch = filesRes.rows.find(f => f.applicationId === app.id);
        console.log(`- App ID ${app.id} (Bank: ${app.bank}, Status: ${app.status}) -> FileEntry Match: ${fileMatch ? 'YES (ID: ' + fileMatch.id + ', bankId: ' + fileMatch.bankId + ')' : 'NO'}`);
    }

    await client.end();
}

run().catch(err => {
    console.error('Error running check:', err);
    process.exit(1);
});
