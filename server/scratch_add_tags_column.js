const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log("Checking and adding tags column to LoanApplication...");
    const res = await client.query(`
        ALTER TABLE "LoanApplication" 
        ADD COLUMN IF NOT EXISTS "tags" text DEFAULT '';
    `);
    
    console.log("Tags column processed successfully.");
    await client.end();
}

runMigration().catch(console.error);
