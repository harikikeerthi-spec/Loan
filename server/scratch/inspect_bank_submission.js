const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'BankSubmission'
    `);
    console.log("Columns of BankSubmission:", res.rows);

    await client.end();
}

main().catch(console.error);
