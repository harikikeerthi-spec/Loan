const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('Inserting a mock conversation...');
        
        // Use a static UUID so it is deterministic or dynamic
        const convId = '550e8400-e29b-41d4-a716-446655440000';
        
        // Clean existing mock if any
        await client.query('DELETE FROM "Message" WHERE "conversationId" = $1', [convId]);
        await client.query('DELETE FROM "Conversation" WHERE "id" = $1', [convId]);
        
        await client.query(`
            INSERT INTO "Conversation" (id, "customerPhone", "customerEmail", "customerName", status, metadata)
            VALUES ($1, '9999999999', 'student.mock@gmail.com', 'Mock Student', 'active', '{"type": "staff"}')
        `, [convId]);
        
        console.log('✓ Mock conversation inserted.');

        console.log('Inserting a mock message...');
        await client.query(`
            INSERT INTO "Message" (id, "conversationId", "senderType", "senderId", "receiverType", content, "messageType", status)
            VALUES (gen_random_uuid(), $1, 'customer', '9999999999', 'staff', 'Hello! I would like to inquire about loan schemes.', 'text', 'sent')
        `, [convId]);
        
        console.log('✓ Mock message inserted.');

        // Re-grant privileges and reload schema just in case
        await client.query('GRANT ALL ON "Conversation" TO service_role, anon, authenticated, postgres;');
        await client.query('GRANT ALL ON "Message" TO service_role, anon, authenticated, postgres;');
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('✓ Privileges granted and schema reload notified.');
        
    } catch (e) {
        console.error('Failed to seed mock conversation:', e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
