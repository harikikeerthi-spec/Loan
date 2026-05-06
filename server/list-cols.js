const { Client } = require('pg');
require('dotenv').config();

async function listCols() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('--- Bank ---');
    const resB = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Bank'");
    console.log(resB.rows.map(r => r.column_name));
    
    await client.end();
}
listCols();
