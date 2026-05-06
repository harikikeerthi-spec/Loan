
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixSchema() {
    console.log('Adding missing columns to UserDocument...');
    
    // We use a raw RPC or just try to insert/update to see if it works, 
    // but the best way is to use a direct SQL execution if possible.
    // Since Supabase client doesn't support raw SQL easily without an RPC,
    // I will try to use the DATABASE_URL with a simple pg client.
    
    const { Client } = require('pg');
    // Modify URL to use direct port 5432 and remove pgbouncer for DDL
    const directUrl = process.env.DATABASE_URL.replace(':6543', ':5432').replace('pgbouncer=true', 'pgbouncer=false');
    
    const client = new Client({
        connectionString: directUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected directly to PostgreSQL.');
        
        await client.query(`
            ALTER TABLE "UserDocument" 
            ADD COLUMN IF NOT EXISTS "digilockerTxId" TEXT,
            ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS "verificationMetadata" JSONB;
        `);
        
        console.log('Successfully updated UserDocument table schema!');
    } catch (err) {
        console.error('Error updating schema:', err.message);
    } finally {
        await client.end();
    }
}

fixSchema();
