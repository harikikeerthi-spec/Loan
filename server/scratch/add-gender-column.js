const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('Adding gender column to User table...');
        await client.query(`
            ALTER TABLE "User" 
            ADD COLUMN IF NOT EXISTS "gender" TEXT;
        `);

        console.log('Gender column checked/added successfully');
    } catch (e) {
        console.error('Error adding column:', e);
    } finally {
        await client.end();
    }
}

run();
