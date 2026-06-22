const { Client } = require('pg');
require('dotenv').config();

async function queryMessages() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('--- User ropayi2211@aspensif.com ---');
        const resMsg = await client.query('SELECT id, email, "firstName", "lastName", role FROM "User" WHERE "email" = \'ropayi2211@aspensif.com\'');
        console.log(JSON.stringify(resMsg.rows, null, 2));
    } catch (e) {
        console.error('Error querying messages:', e);
    } finally {
        await client.end();
    }
}
queryMessages();
