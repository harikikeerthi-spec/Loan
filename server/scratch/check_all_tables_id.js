const { Client } = require('pg');
require('dotenv').config();

async function checkAll() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const res = await client.query(`
        SELECT table_name, column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE column_name = 'id' AND table_schema = 'public'
    `);
    
    console.log("\n=================== ID Columns Default Values ===================");
    res.rows.forEach(row => {
        console.log(` - ${row.table_name}: default = ${row.column_default} (type: ${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    await client.end();
}

checkAll().catch(console.error);
