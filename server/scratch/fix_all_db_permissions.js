const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('No database connection string found in environment variables.');
        process.exit(1);
    }

    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('Fetching all tables in the public schema...');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE';
        `);

        const tables = res.rows.map(row => row.table_name);
        console.log(`Found ${tables.length} tables to grant privileges on:`, tables);

        for (const table of tables) {
            try {
                // Grant all privileges
                await client.query(`GRANT ALL PRIVILEGES ON TABLE "${table}" TO postgres, anon, authenticated, service_role;`);
                console.log(`✓ Granted privileges on TABLE "${table}"`);
            } catch (err) {
                console.error(`✗ Failed to grant privileges on TABLE "${table}":`, err.message);
            }
        }

        console.log('\nPrivileges update completed successfully.');
    } catch (e) {
        console.error('Fatal error during permissions grant:', e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
