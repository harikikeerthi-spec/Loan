const { Client } = require('pg');
require('dotenv').config();

async function query() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query(
            'SELECT * FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
            ['ad1097dd-ab70-42f1-a879-1cacbef1fa01']
        );
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
query();
