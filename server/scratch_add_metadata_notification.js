const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log("Checking and adding metadata column to Notification...");
    const res = await client.query(`
        ALTER TABLE "Notification" 
        ADD COLUMN IF NOT EXISTS "metadata" jsonb;
    `);
    
    console.log("Metadata column processed successfully:", res);
    await client.end();
}

runMigration().catch(console.error);
