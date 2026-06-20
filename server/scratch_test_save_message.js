const { Client } = require('pg');
require('dotenv').config();

async function testInsert() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('Inserting test message...');
        const query = `
            INSERT INTO "Message" ("conversationId", "senderType", "senderId", "receiverType", "content", "messageType", "status")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            'ad1097dd-ab70-42f1-a879-1cacbef1fa01', // conversationId from the screenshot
            'staff',                                // senderType
            'staff@example.com',                    // senderId
            'customer',                             // receiverType
            'Test message insertion',               // content
            'text',                                 // messageType
            'sent'                                  // status
        ];
        
        const res = await client.query(query, values);
        console.log('Success:', res.rows[0]);
    } catch (e) {
        console.error('Error inserting message:', e);
    } finally {
        await client.end();
    }
}
testInsert();
