const { Client } = require('pg');
require('dotenv').config();

async function checkChatSchema() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('--- Conversation Columns ---');
        const resConv = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Conversation'");
        console.log(resConv.rows);
        
        console.log('--- Message Columns ---');
        const resMsg = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Message'");
        console.log(resMsg.rows);
    } catch (e) {
        console.error('Error checking schema:', e);
    } finally {
        await client.end();
    }
}
checkChatSchema();
