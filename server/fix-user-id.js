const { Client } = require('pg');
require('dotenv').config();

async function fixUserTable() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Check if uuid-ossp extension exists (for uuid_generate_v4)
        console.log('Checking extensions...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('uuid-ossp extension ensures.');

        // 2. Check current User table columns
        console.log('Checking User table schema...');
        const res = await client.query(`
            SELECT column_name, column_default, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name = 'id'
        `);

        if (res.rows.length === 0) {
            console.error('User table not found!');
            return;
        }

        const idCol = res.rows[0];
        console.log('ID Column Details:', idCol);

        if (!idCol.column_default) {
            console.log('ID column is missing a default value. Fixing...');
            
            // Depending on type, set appropriate default
            if (idCol.data_type === 'text' || idCol.data_type === 'uuid') {
                await client.query('ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()');
                console.log('Set default to uuid_generate_v4() for column id.');
            } else {
                console.log('Unsupported ID type for auto-fix:', idCol.data_type);
            }
        } else {
            console.log('ID column already has a default value:', idCol.column_default);
        }

        // 3. Double check other tables if needed?
        // Let's just fix User for now as requested.

    } catch (err) {
        console.error('Error fixing table:', err);
    } finally {
        await client.end();
    }
}

fixUserTable();
