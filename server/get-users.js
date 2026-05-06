const { Client } = require('pg');
require('dotenv').config();

async function getUsers() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query("SELECT email, role, \"firstName\", \"lastName\" FROM \"User\"");
    console.log(res.rows);
    await client.end();
}
getUsers();
