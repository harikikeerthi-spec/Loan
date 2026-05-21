const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query("SELECT id, email, role FROM \"User\" WHERE id LIKE 'bank_%'");
    console.log('Users with bank_ ids:', res.rows);
    await client.end();
}
check().catch(console.error);
