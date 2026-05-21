const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT id, email, role FROM "User"');
    console.log('Test users:', res.rows.filter(r => ['chinnu2341@gmail.com', 'staffvidhya@gmail.com', 'shannukalneedi@gmail.com'].includes(r.email)));
    await client.end();
}

main().catch(console.error);
