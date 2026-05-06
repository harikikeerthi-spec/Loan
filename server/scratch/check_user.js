require('dotenv').config();
const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT email, role, "firstName" FROM "User" WHERE role IN (\'bank\', \'partner_bank\', \'admin\', \'staff\')');
    console.log(JSON.stringify(res.rows));
    await client.end();
}
run();
