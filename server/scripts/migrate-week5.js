const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database successfully');

        // 1. BankScheme Table
        console.log('\nCreating BankScheme table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankScheme" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "bankName" VARCHAR(255) NOT NULL,
                "schemeName" VARCHAR(255) NOT NULL,
                "interestRate" DOUBLE PRECISION NOT NULL,
                "minLoanAmount" DOUBLE PRECISION NOT NULL,
                "maxLoanAmount" DOUBLE PRECISION NOT NULL,
                "validFrom" TIMESTAMP(3) NOT NULL,
                "validTo" TIMESTAMP(3) NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ BankScheme table created');

        // 2. BankProduct Table
        console.log('\nCreating BankProduct table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankProduct" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "bankId" VARCHAR(255) NOT NULL,
                "productName" VARCHAR(255) NOT NULL,
                "minRate" DOUBLE PRECISION NOT NULL,
                "maxRate" DOUBLE PRECISION NOT NULL,
                "processingFee" DOUBLE PRECISION DEFAULT 0.0,
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ BankProduct table created');

        // 3. BankBranch Table
        console.log('\nCreating BankBranch table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankBranch" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "bankId" VARCHAR(255) NOT NULL,
                "branchName" VARCHAR(255) NOT NULL,
                "branchCode" VARCHAR(100) NOT NULL UNIQUE,
                "city" VARCHAR(255),
                "state" VARCHAR(255),
                "contactEmail" VARCHAR(255),
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ BankBranch table created');

        // 4. BankDocumentChecklist Table
        console.log('\nCreating BankDocumentChecklist table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankDocumentChecklist" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "bankName" VARCHAR(255) NOT NULL,
                "productType" VARCHAR(255) NOT NULL,
                "requiredDocs" JSONB DEFAULT '[]'::jsonb,
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ BankDocumentChecklist table created');

        // 5. OfficerTarget Table
        console.log('\nCreating OfficerTarget table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "OfficerTarget" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "officerEmail" VARCHAR(255) NOT NULL,
                "targetMonth" VARCHAR(7) NOT NULL,
                "targetAmount" DOUBLE PRECISION NOT NULL,
                "actualAmount" DOUBLE PRECISION DEFAULT 0.0,
                "targetCount" INTEGER NOT NULL,
                "actualCount" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ OfficerTarget table created');

        // 6. RMProfile Table
        console.log('\nCreating RMProfile table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "RMProfile" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "name" VARCHAR(255) NOT NULL,
                "email" VARCHAR(255) NOT NULL UNIQUE,
                "phone" VARCHAR(50) NOT NULL,
                "bankName" VARCHAR(255) NOT NULL,
                "branchName" VARCHAR(255),
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ RMProfile table created');

        // 7. Add target fields to LoanApplication if not exist
        console.log('\nCreating performance indexes...');
        await client.query('CREATE INDEX IF NOT EXISTS "idx_bankscheme_bank" ON "BankScheme"("bankName");');
        await client.query('CREATE INDEX IF NOT EXISTS "idx_officertarget_email" ON "OfficerTarget"("officerEmail");');
        await client.query('CREATE INDEX IF NOT EXISTS "idx_rmprofile_bank" ON "RMProfile"("bankName");');
        console.log('✓ Performance indexes created');

        console.log('\n✓ Week 5 database migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
