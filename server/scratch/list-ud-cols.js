const { Client } = require('pg');
require('dotenv').config();

async function listCols() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('--- parents ---');
    const resA = await client.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'parents'");
    console.log(resA.rows);
    
    await client.end();
}
listCols();
