const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('Connected to database');
        
        console.log('Adding columns to UserDocument...');
        await client.query('ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "digilockerTxId" TEXT');
        await client.query('ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP WITH TIME ZONE');
        await client.query('ALTER TABLE "UserDocument" ADD COLUMN IF NOT EXISTS "verificationMetadata" JSONB');
        
        console.log('Successfully updated UserDocument table');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await client.end();
    }
}

run();
