const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database for blueprint alterations...');

        // 1. Create UUID extension if not exists
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Helper function to create table if not exists
        const createTable = async (tableName, ddl) => {
            console.log(`Checking table: ${tableName}...`);
            const existsRes = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = $1
                );
            `, [tableName]);

            if (existsRes.rows[0].exists) {
                console.log(`  Table "${tableName}" already exists. Skipping.`);
            } else {
                console.log(`  Creating table "${tableName}"...`);
                await client.query(ddl);
                console.log(`  Table "${tableName}" created successfully.`);
            }
        };

        // 2. Alter LoanApplication with new columns if they do not exist
        const addColumn = async (columnName, ddlType) => {
            const existsRes = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'LoanApplication' AND column_name = $1
                );
            `, [columnName]);

            if (existsRes.rows[0].exists) {
                console.log(`  Column "LoanApplication.${columnName}" already exists. Skipping.`);
            } else {
                console.log(`  Adding column "LoanApplication.${columnName}"...`);
                await client.query(`ALTER TABLE "LoanApplication" ADD COLUMN "${columnName}" ${ddlType}`);
                console.log(`  Column "LoanApplication.${columnName}" added successfully.`);
            }
        };

        console.log('Altering "LoanApplication" table...');
        await addColumn('lanNumber', 'VARCHAR(100) UNIQUE');
        await addColumn('lanEnteredAt', 'TIMESTAMP(3)');
        await addColumn('fileLoggedBy', 'TEXT');
        await addColumn('productId', 'TEXT');
        await addColumn('branchId', 'TEXT');
        await addColumn('assignedOfficer', 'TEXT');
        await addColumn('assignedStaffId', 'TEXT');
        await addColumn('sanctionDate', 'TIMESTAMP(3)');
        await addColumn('sanctionExpiry', 'TIMESTAMP(3)');
        await addColumn('sanctionLetterUrl', 'TEXT');
        await addColumn('roiType', 'VARCHAR(50)');
        await addColumn('roiBase', 'DOUBLE PRECISION');
        await addColumn('roiEffective', 'DOUBLE PRECISION');
        await addColumn('roiSubsidy', 'DOUBLE PRECISION');
        await addColumn('priority', 'VARCHAR(50) DEFAULT \'NORMAL\'');
        await addColumn('turnaroundDays', 'INTEGER');
        await addColumn('previousSubmissions', 'TEXT'); // Store JSON array as string
        await addColumn('submissionAttempt', 'INTEGER DEFAULT 1');

        console.log('Creating new blueprint tables...');

        // 3. BankProduct Table
        await createTable('BankProduct', `
            CREATE TABLE "BankProduct" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "productName" TEXT NOT NULL,
                "eligibility" TEXT, -- JSON
                "maxAmount" DOUBLE PRECISION NOT NULL,
                "minAmount" DOUBLE PRECISION,
                "roiMin" DOUBLE PRECISION NOT NULL,
                "roiMax" DOUBLE PRECISION NOT NULL,
                "processingFee" DOUBLE PRECISION,
                "maxTenure" INTEGER NOT NULL,
                "moratoriumRule" TEXT,
                "requiredDocs" TEXT, -- JSON
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "BankProduct_pkey" PRIMARY KEY ("id")
            );
        `);

        // 4. BankBranch Table
        await createTable('BankBranch', `
            CREATE TABLE "BankBranch" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "branchName" TEXT NOT NULL,
                "branchCode" TEXT NOT NULL,
                "coverageAreas" TEXT, -- JSON
                "maxCapacity" INTEGER,
                CONSTRAINT "BankBranch_pkey" PRIMARY KEY ("id")
            );
        `);

        // 5. BankDecision Table
        await createTable('BankDecision', `
            CREATE TABLE "BankDecision" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "bankId" TEXT NOT NULL,
                "decision" VARCHAR(100) NOT NULL, -- SANCTIONED, CONDITIONAL, COUNTER_OFFER, REJECTED
                "sanctionAmount" DOUBLE PRECISION,
                "interestRate" DOUBLE PRECISION,
                "roiType" VARCHAR(50),
                "tenure" INTEGER,
                "conditions" TEXT, -- JSON
                "conditionDeadline" TIMESTAMP(3),
                "counterOffer" TEXT, -- JSON
                "rejectionReason" TEXT,
                "remarks" TEXT,
                "sanctionLetterUrl" TEXT,
                "sanctionExpiry" TIMESTAMP(3),
                "decidedBy" TEXT NOT NULL,
                "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "BankDecision_pkey" PRIMARY KEY ("id")
            );
        `);

        // 6. ProcessingFee Table
        await createTable('ProcessingFee', `
            CREATE TABLE "ProcessingFee" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL UNIQUE,
                "lanNumber" TEXT,
                "feeAmount" DOUBLE PRECISION NOT NULL,
                "gstAmount" DOUBLE PRECISION,
                "totalAmount" DOUBLE PRECISION NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, WAIVED, REFUNDED
                "paymentMode" VARCHAR(100),
                "paymentRef" TEXT,
                "paidAt" TIMESTAMP(3),
                "waivedBy" TEXT,
                "waiverReason" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ProcessingFee_pkey" PRIMARY KEY ("id")
            );
        `);

        // 7. Disbursement Table
        await createTable('Disbursement', `
            CREATE TABLE "Disbursement" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "trancheNumber" INTEGER NOT NULL DEFAULT 1,
                "amount" DOUBLE PRECISION NOT NULL,
                "mode" VARCHAR(50) NOT NULL, -- NEFT, RTGS, DD
                "utrNumber" VARCHAR(100),
                "beneficiary" TEXT NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
                "disbursedAt" TIMESTAMP(3) NOT NULL,
                "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "confirmedBy" TEXT NOT NULL,
                "nextTrancheDue" TIMESTAMP(3),
                "remainingSanction" DOUBLE PRECISION,
                CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
            );
        `);

        // 8. BankQuery Table
        await createTable('BankQuery', `
            CREATE TABLE "BankQuery" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "raisedBy" TEXT NOT NULL,
                "queryType" VARCHAR(100) NOT NULL, -- DOCUMENT, INFORMATION, CLARIFICATION
                "description" TEXT NOT NULL,
                "requiredDocs" TEXT, -- JSON
                "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, RESPONDED, RESOLVED
                "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "resolvedAt" TIMESTAMP(3),
                CONSTRAINT "BankQuery_pkey" PRIMARY KEY ("id")
            );
        `);

        // 9. QueryResponse Table
        await createTable('QueryResponse', `
            CREATE TABLE "QueryResponse" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "queryId" TEXT NOT NULL,
                "respondedBy" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "attachments" TEXT, -- JSON
                "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "QueryResponse_pkey" PRIMARY KEY ("id")
            );
        `);

        // 10. FileQualityRating Table
        await createTable('FileQualityRating', `
            CREATE TABLE "FileQualityRating" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL UNIQUE,
                "completeness" INTEGER NOT NULL,
                "accuracy" INTEGER NOT NULL,
                "clarity" INTEGER NOT NULL,
                "overall" INTEGER NOT NULL,
                "comments" TEXT,
                "ratedBy" TEXT NOT NULL,
                "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FileQualityRating_pkey" PRIMARY KEY ("id")
            );
        `);

        // 11. ConsentRecord Table
        await createTable('ConsentRecord', `
            CREATE TABLE "ConsentRecord" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "studentId" TEXT NOT NULL,
                "bankId" TEXT NOT NULL,
                "consentId" TEXT NOT NULL UNIQUE,
                "scope" TEXT NOT NULL,
                "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "validTill" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
            );
        `);

        // 12. AuditLog Table
        await createTable('AuditLog', `
            CREATE TABLE "AuditLog" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "entityType" VARCHAR(100) NOT NULL, -- LOAN, DOCUMENT, DECISION, DISBURSEMENT
                "entityId" TEXT NOT NULL,
                "action" VARCHAR(100) NOT NULL, -- CREATED, UPDATED, SANCTIONED, REJECTED, QUERIED
                "performedBy" TEXT NOT NULL,
                "role" VARCHAR(100) NOT NULL, -- BANK_OFFICER, STAFF, ADMIN, SYSTEM
                "details" TEXT, -- JSON diff
                "ipAddress" VARCHAR(50),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
            );
        `);

        // 13. ReferralFee Table
        await createTable('ReferralFee', `
            CREATE TABLE "ReferralFee" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL UNIQUE,
                "bankId" TEXT NOT NULL,
                "feeType" VARCHAR(50) NOT NULL, -- FLAT, PERCENTAGE
                "feeAmount" DOUBLE PRECISION NOT NULL,
                "invoiceStatus" VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, INVOICED, PAID
                "invoiceNumber" TEXT,
                "paidAt" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ReferralFee_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('All dynamic bank dashboard migrations executed successfully.');

    } catch (err) {
        console.error('Fatal migration error:', err);
    } finally {
        await client.end();
    }
}

runMigration();
