const { Client } = require('pg');
require('dotenv').config();

async function getBankUsers() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query("SELECT email, role, \"firstName\", \"lastName\" FROM \"User\" WHERE role = 'bank'");
    console.log(res.rows);
    await client.end();
}
getBankUsers();
