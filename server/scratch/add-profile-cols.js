const { Client } = require('pg');
require('dotenv').config();

async function addProfileCols() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log('Altering table User to add onboarding profile columns...');
    const sql = `
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passport" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nationality" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mailingAddress" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContact" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "academic" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workExperience" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tests" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "family" text;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coApplicant" text;
    `;
    
    try {
        await client.query(sql);
        console.log('Columns added successfully to User table!');
    } catch (err) {
        console.error('Error adding columns to User table:', err);
    } finally {
        await client.end();
    }
}

addProfileCols().catch(console.error);
