const { Client } = require('pg');
require('dotenv').config();

async function listCols() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log('--- BankDecision ---');
    const resA = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'BankDecision'");
    console.log(resA.rows);
    
    console.log('--- conditional_sanctions ---');
    const resB = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conditional_sanctions'");
    console.log(resB.rows);
    
    await client.end();
}
listCols();
