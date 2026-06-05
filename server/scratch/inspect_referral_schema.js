const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const schemaRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Referral'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== Referral Schema ===`);
    console.log(schemaRes.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    await client.end();
}

main().catch(console.error);
