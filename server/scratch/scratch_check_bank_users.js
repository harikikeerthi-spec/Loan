const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT * FROM "bank_users"');
    console.log('bank_users:', res.rows);
    const users = await client.query('SELECT id, email, role FROM "User"');
    console.log('users:', users.rows);
    await client.end();
}
run();
