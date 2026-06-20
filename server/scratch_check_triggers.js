const { Client } = require('pg');
require('dotenv').config();

async function checkConstraints() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('--- Latest 10 AuditLog Entries ---');
        const res = await client.query('SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Error checking constraints:', e);
    } finally {
        await client.end();
    }
}
checkConstraints();

