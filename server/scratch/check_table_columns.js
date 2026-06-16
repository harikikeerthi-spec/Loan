const { Client } = require('pg');
require('dotenv').config();

async function inspectColumns() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const tables = ['ApplicationStatusHistory', 'Notification', 'ApplicationDocument'];
    
    for (const table of tables) {
        console.log(`\n=================== Columns for: ${table} ===================`);
        const res = await client.query(
            "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
            [table]
        );
        res.rows.forEach(row => {
            console.log(` - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
    }
    
    await client.end();
}

inspectColumns().catch(console.error);
