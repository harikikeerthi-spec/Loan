const { Client } = require('pg');
require('dotenv').config();

async function listCols() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const tables = ['StaffProfile', 'StaffProfileShare', 'LoanApplication', 'ApplicationStatusHistory', 'Notification', 'ApplicationNote'];
    
    for (const table of tables) {
        console.log(`\n--- ${table} ---`);
        const res = await client.query(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1",
            [table]
        );
        console.log(res.rows.map(r => `${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
    }
    
    await client.end();
}
listCols().catch(console.error);
