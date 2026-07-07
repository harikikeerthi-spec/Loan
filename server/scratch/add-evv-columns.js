const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('Adding EVV columns to LoanApplication table...');
        await client.query(`
            ALTER TABLE "LoanApplication" 
            ADD COLUMN IF NOT EXISTS "evvOverall" DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS "evvMonthlyBreakdown" JSONB,
            ADD COLUMN IF NOT EXISTS "evvStatus" TEXT;
        `);

        console.log('EVV columns added successfully');
    } catch (e) {
        console.error('Error adding EVV columns:', e);
    } finally {
        await client.end();
    }
}

run();
