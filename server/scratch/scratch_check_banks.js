const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT * FROM "Bank"');
    console.log('Banks:', res.rows);
    const loanApps = await client.query('SELECT id, bank, status FROM "LoanApplication" LIMIT 5');
    console.log('LoanApplications:', loanApps.rows);
    await client.end();
}
run();
