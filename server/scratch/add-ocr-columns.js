const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Add columns to User table to support OCR data extraction
        console.log('Adding OCR columns to User table...');
        await client.query(`
            ALTER TABLE "User" 
            ADD COLUMN IF NOT EXISTS "documentVerified" BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS "panNumber" TEXT,
            ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT,
            ADD COLUMN IF NOT EXISTS "fatherName" TEXT,
            ADD COLUMN IF NOT EXISTS "permanentAddress" TEXT;
        `);

        console.log('OCR columns added successfully');
    } catch (e) {
        console.error('Error adding columns:', e);
    } finally {
        await client.end();
    }
}

run();
