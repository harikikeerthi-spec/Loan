const { Client } = require('pg');
require('dotenv').config();

async function listUsers() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log(`\n=== Users in DB ===`);
    const res = await client.query("SELECT id, email, role FROM \"User\" LIMIT 10");
    console.log(res.rows);

    await client.end();
}

listUsers().catch(console.error);
