const { Client } = require('pg');
require('dotenv').config();

async function queryStaffMessages() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('--- Messages with senderType = staff ---');
        const res = await client.query('SELECT * FROM "Message" WHERE "senderType" = \'staff\' ORDER BY "createdAt" DESC LIMIT 10');
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('--- Conversation table record count ---');
        const countRes = await client.query('SELECT count(*) FROM "Conversation"');
        console.log(countRes.rows);
    } catch (e) {
        console.error('Error querying staff messages:', e);
    } finally {
        await client.end();
    }
}
queryStaffMessages();
