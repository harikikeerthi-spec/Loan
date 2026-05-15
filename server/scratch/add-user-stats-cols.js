const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Add columns to User table
        await client.query(`
            ALTER TABLE "User" 
            ADD COLUMN IF NOT EXISTS "last_login_ip" TEXT,
            ADD COLUMN IF NOT EXISTS "last_login_device" TEXT,
            ADD COLUMN IF NOT EXISTS "last_login_location" TEXT,
            ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP WITH TIME ZONE;
        `);

        console.log('Columns added successfully');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
