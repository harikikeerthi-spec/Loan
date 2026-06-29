const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT id, email, role FROM "User"');
    console.log('Non-user accounts:', res.rows.filter(r => r.role !== 'user'));
    await client.end();
}

main().catch(console.error);
