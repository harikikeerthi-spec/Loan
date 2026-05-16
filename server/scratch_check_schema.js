const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('--- StaffProfile ---');
    const resS = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'StaffProfile'");
    console.log(resS.rows.map(r => r.column_name));
    
    await client.end();
}
checkSchema();
