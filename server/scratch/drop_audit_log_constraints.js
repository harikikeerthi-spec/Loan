const { Client } = require('pg');
require('dotenv').config();

async function dropConstraints() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log('Altering AuditLog table to drop foreign key constraints...');
    
    try {
        console.log('Dropping constraint AuditLog_entityId_fkey...');
        await client.query('ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_entityId_fkey"');
        console.log('Dropped AuditLog_entityId_fkey successfully.');
    } catch (e) {
        console.error('Failed to drop AuditLog_entityId_fkey:', e.message);
    }

    try {
        console.log('Dropping constraint AuditLog_initiatedBy_fkey...');
        await client.query('ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_initiatedBy_fkey"');
        console.log('Dropped AuditLog_initiatedBy_fkey successfully.');
    } catch (e) {
        console.error('Failed to drop AuditLog_initiatedBy_fkey:', e.message);
    }

    await client.end();
    console.log('Done.');
}

dropConstraints().catch(console.error);
