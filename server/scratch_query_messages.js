const { Client } = require('pg');
require('dotenv').config();

async function queryMessages() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('--- Latest 5 Messages ---');
        const resMsg = await client.query('SELECT * FROM "Message" ORDER BY "createdAt" DESC LIMIT 5');
        console.log(JSON.stringify(resMsg.rows, null, 2));

        console.log('--- Latest 5 Conversations ---');
        const resConv = await client.query('SELECT * FROM "Conversation" ORDER BY "updatedAt" DESC LIMIT 5');
        console.log(JSON.stringify(resConv.rows, null, 2));
    } catch (e) {
        console.error('Error querying messages:', e);
    } finally {
        await client.end();
    }
}
queryMessages();
