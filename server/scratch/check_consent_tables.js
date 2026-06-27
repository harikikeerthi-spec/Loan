const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name ILIKE '%consent%'
    `);
    
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Consent-related tables:', tables);

    for (const table of tables) {
        const colsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [table]);
        console.log(`\n=== Table: ${table} ===`);
        console.log(colsRes.rows.map(r => `  ${r.column_name} (${r.data_type})`).join('\n'));
    }

    await client.end();
}

main().catch(console.error);
