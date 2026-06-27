const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const cols = ['applicationid', 'consenttype', 'status', 'recordedat', 'recordedby'];
    
    for (const col of cols) {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND LOWER(column_name) = $1
        `, [col]);
        console.log(`Column '${col}' is present in tables:`, res.rows.map(r => r.table_name));
    }

    await client.end();
}

main().catch(console.error);
