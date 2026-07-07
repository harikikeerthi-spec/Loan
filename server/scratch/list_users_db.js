const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT email, role, "firstName", "lastName" FROM "User" WHERE email = \'pkfc0406@gmail.com\'');
    console.log('User details:', res.rows[0]);
    await client.end();
}

main().catch(console.error);
