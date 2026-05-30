const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('No connection string found');
        process.exit(1);
    }

    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('Altering "BankProduct" table to ensure minRate and maxRate columns exist...');
        await client.query(`
            ALTER TABLE "BankProduct" 
            ADD COLUMN IF NOT EXISTS "minRate" DOUBLE PRECISION DEFAULT 8.5,
            ADD COLUMN IF NOT EXISTS "maxRate" DOUBLE PRECISION DEFAULT 12.0;
        `);
        console.log('✓ "BankProduct" altered.');

        console.log('Altering "BankBranch" table to ensure city, state, contactEmail, isActive, and createdAt exist...');
        await client.query(`
            ALTER TABLE "BankBranch" 
            ADD COLUMN IF NOT EXISTS "city" VARCHAR(255) DEFAULT 'Bangalore',
            ADD COLUMN IF NOT EXISTS "state" VARCHAR(255) DEFAULT 'Karnataka',
            ADD COLUMN IF NOT EXISTS "contactEmail" VARCHAR(255) DEFAULT 'branch@sbi.co.in',
            ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✓ "BankBranch" altered.');

        console.log('Granting privileges on all tables again...');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE';
        `);

        for (const row of res.rows) {
            const table = row.table_name;
            await client.query(`GRANT ALL PRIVILEGES ON TABLE "${table}" TO postgres, anon, authenticated, service_role;`);
        }
        console.log('✓ Privileges granted.');

        // Notify PostgREST to reload schema
        await client.query(`NOTIFY pgrst, 'reload schema';`);
        console.log('✓ PostgREST schema reload notification sent.');

    } catch (e) {
        console.error('Migration patch failed:', e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
