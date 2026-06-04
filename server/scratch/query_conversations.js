const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT DISTINCT "customerPhone" FROM "Conversation"');
    console.log("All customer phones in Conversations:", res.rows);
    await client.end();
}
run().catch(console.error);
