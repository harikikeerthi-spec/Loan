const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('--- ProcessingFee Columns ---');
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ProcessingFee'
        ORDER BY column_name;
    `);
    
    res.rows.forEach(r => {
        console.log(` - ${r.column_name} (${r.data_type})`);
    });
    
    await client.end();
}

run().catch(console.error);
