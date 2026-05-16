const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('--- User columns ---');
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'User'
        ORDER BY column_name
    `);
    console.log(res.rows);
    
    await client.end();
}
checkSchema();
