const { Client } = require('pg');
require('dotenv').config();

async function runUpdates() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database for Week 3 additions...');

        // 1. Create StudentBankConsent Table
        console.log('\nCreating StudentBankConsent table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "StudentBankConsent" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "studentId" TEXT NOT NULL,
                "bankId" TEXT NOT NULL,
                "isGranted" BOOLEAN NOT NULL DEFAULT TRUE,
                "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "ipAddress" VARCHAR(100),
                "userAgent" TEXT,
                CONSTRAINT "uniq_student_bank" UNIQUE ("studentId", "bankId")
            );
        `);
        console.log('✓ StudentBankConsent table ready');

        // 2. Create BankQueryTemplate Table
        console.log('\nCreating BankQueryTemplate table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankQueryTemplate" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "bankId" TEXT NOT NULL,
                "templateName" VARCHAR(255) NOT NULL,
                "queryType" VARCHAR(50) NOT NULL,
                "queryDescription" TEXT NOT NULL,
                "docsChecklist" JSONB DEFAULT '[]'::jsonb,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ BankQueryTemplate table ready');

        // Helper helper to safely add columns to existing tables
        const addColumn = async (tableName, columnName, ddlType) => {
            try {
                const result = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
                    );
                `, [tableName, columnName]);
                
                if (!result.rows[0].exists) {
                    await client.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${ddlType}`);
                    console.log(`  ✓ Added column: ${columnName} to ${tableName}`);
                } else {
                    console.log(`  • Column already exists: ${columnName} in ${tableName}`);
                }
            } catch (err) {
                console.log(`  ! Error adding ${columnName} to ${tableName}: ${err.message}`);
            }
        };

        // 3. Add Columns to BankSubmission
        console.log('\nUpdating BankSubmission fields...');
        await addColumn('BankSubmission', 'isOnHold', 'BOOLEAN DEFAULT FALSE');
        await addColumn('BankSubmission', 'holdReason', 'TEXT');
        await addColumn('BankSubmission', 'holdSetAt', 'TIMESTAMP(3)');
        await addColumn('BankSubmission', 'slaPausedDurationMs', 'BIGINT DEFAULT 0');
        await addColumn('BankSubmission', 'assignedOfficerId', 'TEXT');
        await addColumn('BankSubmission', 'assignedOfficerName', 'VARCHAR(255)');
        await addColumn('BankSubmission', 'qualityRating', 'JSONB');
        await addColumn('BankSubmission', 'amendments', "JSONB DEFAULT '[]'::jsonb");
        await addColumn('BankSubmission', 'disbursementTranches', "JSONB DEFAULT '[]'::jsonb");
        await addColumn('BankSubmission', 'cancellationReason', 'TEXT');
        await addColumn('BankSubmission', 'cancellationRequestedBy', 'TEXT');
        await addColumn('BankSubmission', 'cancellationRequestedAt', 'TIMESTAMP(3)');
        await addColumn('BankSubmission', 'refundAmount', 'DOUBLE PRECISION');

        // 4. Add Columns to BankWorkflowQueryRequest
        console.log('\nUpdating BankWorkflowQueryRequest fields...');
        await addColumn('BankWorkflowQueryRequest', 'docsChecklist', "JSONB DEFAULT '[]'::jsonb");
        await addColumn('BankWorkflowQueryRequest', 'messages', "JSONB DEFAULT '[]'::jsonb");

        console.log('\n✓ Week 3 database updates completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration update error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runUpdates();
