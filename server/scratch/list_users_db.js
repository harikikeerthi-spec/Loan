const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT email, role, "firstName", "lastName" FROM "User" WHERE email = \'shannukalneedi@gmail.com\'');
    console.log('User details:', res.rows[0]);
    await client.end();
}

main().catch(console.error);
