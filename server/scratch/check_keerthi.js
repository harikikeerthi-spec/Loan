const { Client } = require('pg');
require('dotenv').config();

async function checkKeerthi() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log(`\n=== User Details for keerthichinnu0728@gmail.com ===`);
    const res = await client.query("SELECT * FROM \"User\" WHERE email = 'keerthichinnu0728@gmail.com'");
    console.log(JSON.stringify(res.rows[0], null, 2));

    await client.end();
}

checkKeerthi().catch(console.error);
