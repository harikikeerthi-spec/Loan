const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT id, "applicationNumber" FROM "LoanApplication" WHERE id = $1', ['cfb38aba-285f-4a2b-a100-2e0b27ae4ad8']);
    console.log('Result:', res.rows);
    await client.end();
}
main().catch(console.error);
