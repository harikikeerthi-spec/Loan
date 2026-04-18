const { Client } = require('pg');
require('dotenv').config();

async function getConversations() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query("SELECT id, metadata FROM \"Conversation\" LIMIT 5");
    console.log(res.rows);
    await client.end();
}
getConversations();
