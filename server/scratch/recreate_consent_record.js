const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log('Recreating ConsentRecord table...');
    
    // Drop existing table
    await client.query(`DROP TABLE IF EXISTS "ConsentRecord" CASCADE;`);
    console.log('Dropped old ConsentRecord table.');

    // Create table with new schema
    await client.query(`
        CREATE TABLE "ConsentRecord" (
            "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
            "applicationId" TEXT NOT NULL UNIQUE,
            "userId" TEXT,
            "consentType" TEXT,
            "status" TEXT NOT NULL,
            "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "recordedBy" TEXT,
            "studentId" TEXT,
            "bankId" TEXT,
            "consentId" TEXT UNIQUE,
            "scope" TEXT,
            "consentedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            "validTill" TIMESTAMP(3),
            PRIMARY KEY ("id")
        );
    `);
    console.log('Created new ConsentRecord table successfully.');

    // Verify schema
    const crSchema = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'ConsentRecord'
        ORDER BY ordinal_position
    `);
    console.log('\n=== New ConsentRecord Schema ===');
    console.log(crSchema.rows.map(r => `  ${r.column_name} (${r.data_type}) - Nullable: ${r.is_nullable}`).join('\n'));

    await client.end();
}

main().catch(console.error);
