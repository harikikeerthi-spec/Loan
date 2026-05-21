const { Client } = require('pg');
require('dotenv').config();

async function test() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    try {
        const userRes = await client.query('SELECT id, role FROM "User" LIMIT 1');
        if (userRes.rows.length === 0) {
            console.error('No users found in database');
            await client.end();
            return;
        }
        const user = userRes.rows[0];
        console.log('Using User:', user);
        
        const res = await client.query(
            'INSERT INTO "Notification" (id, "userId", title, body, type, "isRead", timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            ['test-' + Date.now(), user.id, 'Test Title', 'Test Body', 'test', false, new Date()]
        );
        console.log('Success:', res.rows[0]);
        
        // Clean up
        await client.query('DELETE FROM "Notification" WHERE id = $1', [res.rows[0].id]);
        console.log('Cleanup success');
    } catch (e) {
        console.error('Error:', e.message);
    }
    await client.end();
}
test().catch(console.error);
