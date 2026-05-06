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
        
        console.log('Setting defaults for timestamps...');
        await client.query('ALTER TABLE "UserDocument" ALTER COLUMN "updatedAt" SET DEFAULT now()');
        await client.query('ALTER TABLE "UserDocument" ALTER COLUMN "createdAt" SET DEFAULT now()');
        
        console.log('Successfully updated UserDocument defaults');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await client.end();
    }
}

run();
