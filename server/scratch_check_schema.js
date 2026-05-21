const { Client } = require('pg');
require('dotenv').config();

async function inspectSchema() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const tables = ['LoanApplication', 'ApplicationDocument', 'ApplicationNote', 'ApplicationStatusHistory', 'Bank'];
    
    for (const table of tables) {
        console.log(`\n=================== Columns for: ${table} ===================`);
        const res = await client.query(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
            [table]
        );
        res.rows.forEach(row => {
            console.log(` - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });
    }
    
    await client.end();
}

inspectSchema().catch(console.error);
