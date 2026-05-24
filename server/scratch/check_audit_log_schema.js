const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log(`\n=== Table: AuditLog ===`);
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'AuditLog'
        ORDER BY ordinal_position
    `);
    if (res.rows.length === 0) {
        console.log('Table does not exist.');
    } else {
        console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
    }

    await client.end();
}

checkSchema().catch(console.error);
