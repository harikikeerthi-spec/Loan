const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    console.log('Starting migration to add registeredAtIndia column...');
    
    // Use DIRECT_URL for migrations to bypass pgbouncer if possible
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('No database connection string found in .env');
        return;
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, '..', 'scripts', 'add-registered-at-india.sql');
        console.log(`Reading SQL from: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Executing migration...');
        // Split by semicolon if there are multiple statements, or just run the whole thing
        // pg client can handle multiple statements in one query call
        await client.query(sql);
        console.log('Migration successful.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
