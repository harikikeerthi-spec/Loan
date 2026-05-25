require('dotenv').config();
const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'academic'
    `);
    console.log('academic column schema:', res.rows);
    
    // Also select one row to see the type of academic
    const res2 = await client.query('SELECT academic FROM "User" WHERE academic IS NOT NULL LIMIT 1');
    if (res2.rows.length > 0) {
        console.log('academic column value type:', typeof res2.rows[0].academic, res2.rows[0].academic);
    } else {
        console.log('No academic records found.');
    }
    
    await client.end();
}
run();
