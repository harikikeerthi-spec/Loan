const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL for Bank Dashboard Schema Migrations...');

        // Create UUID extension
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

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

        const addColumn = async (tableName, columnName, columnDef) => {
            console.log(`Checking column: ${tableName}.${columnName}...`);
            const existsRes = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
                );
            `, [tableName, columnName]);

            if (existsRes.rows[0].exists) {
                console.log(`  Column "${columnName}" already exists. Skipping.`);
            } else {
                console.log(`  Adding column "${columnName}"...`);
                await client.query(`ALTER TABLE "${tableName}" ADD COLUMN ${columnDef}`);
                console.log(`  Column "${columnName}" added successfully.`);
            }
        };

        // ============== NEW TABLES ==============

        // Table: BankProduct
        await createTable('BankProduct', `
            CREATE TABLE "BankProduct" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "productName" VARCHAR(255) NOT NULL,
                "eligibility" JSONB,
                "maxAmount" DOUBLE PRECISION NOT NULL,
                "minAmount" DOUBLE PRECISION,
                "roiMin" DOUBLE PRECISION NOT NULL,
                "roiMax" DOUBLE PRECISION NOT NULL,
                "processingFee" DOUBLE PRECISION,
                "maxTenure" INTEGER NOT NULL,
                "moratoriumRule" VARCHAR(100),
                "requiredDocs" JSONB,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // Table: BankBranch
        await createTable('BankBranch', `
            CREATE TABLE "BankBranch" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "branchName" VARCHAR(255) NOT NULL,
                "branchCode" VARCHAR(50) NOT NULL,
                "coverageAreas" JSONB,
                "maxCapacity" INTEGER,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // Table: BankDecision (comprehensive decisions)
        await createTable('BankDecision', `
            CREATE TABLE "BankDecision" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "bankId" TEXT NOT NULL,
                "decision" VARCHAR(50) NOT NULL,
                "sanctionAmount" DOUBLE PRECISION,
                "interestRate" DOUBLE PRECISION,
                "roiType" VARCHAR(20),
                "tenure" INTEGER,
                "conditions" JSONB,
                "conditionDeadline" TIMESTAMP(3),
                "counterOffer" JSONB,
                "rejectionReason" VARCHAR(255),
                "remarks" TEXT,
                "sanctionLetterUrl" TEXT,
                "sanctionExpiry" TIMESTAMP(3),
                "decidedBy" TEXT NOT NULL,
                "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // Table: ProcessingFee
        await createTable('ProcessingFee', `
            CREATE TABLE "ProcessingFee" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL UNIQUE,
                "lanNumber" VARCHAR(100),
                "feeAmount" DOUBLE PRECISION NOT NULL,
                "gstAmount" DOUBLE PRECISION,
                "totalAmount" DOUBLE PRECISION NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                "paymentMode" VARCHAR(50),
                "paymentRef" VARCHAR(255),
                "paidAt" TIMESTAMP(3),
                "waivedBy" TEXT,
                "waiverReason" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // Table: Disbursement
        await createTable('Disbursement', `
            CREATE TABLE "Disbursement" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "trancheNumber" INTEGER NOT NULL DEFAULT 1,
                "amount" DOUBLE PRECISION NOT NULL,
                "mode" VARCHAR(50) NOT NULL,
                "utrNumber" VARCHAR(100),
                "beneficiary" VARCHAR(255) NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
                "disbursedAt" TIMESTAMP(3) NOT NULL,
                "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "confirmedBy" TEXT NOT NULL,
                "nextTrancheDue" TIMESTAMP(3),
                "remainingSanction" DOUBLE PRECISION,
                PRIMARY KEY ("id")
            );
        `);

        // Table: BankQuery
        await createTable('BankQuery', `
            CREATE TABLE "BankQuery" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "raisedBy" TEXT NOT NULL,
                "queryType" VARCHAR(50) NOT NULL,
                "description" TEXT NOT NULL,
                "requiredDocs" JSONB,
                "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
                "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "resolvedAt" TIMESTAMP(3),
                PRIMARY KEY ("id")
            );
        `);

        // Table: QueryResponse
        await createTable('QueryResponse', `
            CREATE TABLE "QueryResponse" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "queryId" TEXT NOT NULL,
                "respondedBy" VARCHAR(255) NOT NULL,
                "message" TEXT NOT NULL,
                "attachments" JSONB,
                "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // Table: FileQualityRating
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
                PRIMARY KEY ("id")
            );
        `);

        // Table: ConsentRecord
        await createTable('ConsentRecord', `
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
                "consentId" VARCHAR(50) UNIQUE,
                "scope" VARCHAR(255),
                "consentedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
                "validTill" TIMESTAMP(3),
                PRIMARY KEY ("id")
            );
        `);

        // Table: AuditLog
        await createTable('AuditLog', `
            CREATE TABLE "AuditLog" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "entityType" VARCHAR(50) NOT NULL,
                "entityId" TEXT NOT NULL,
                "action" VARCHAR(50) NOT NULL,
                "performedBy" TEXT NOT NULL,
                "role" VARCHAR(50) NOT NULL,
                "details" JSONB,
                "ipAddress" VARCHAR(50),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // Table: ReferralFee
        await createTable('ReferralFee', `
            CREATE TABLE "ReferralFee" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL UNIQUE,
                "bankId" TEXT NOT NULL,
                "feeType" VARCHAR(20) NOT NULL,
                "feeAmount" DOUBLE PRECISION NOT NULL,
                "invoiceStatus" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                "invoiceNumber" VARCHAR(100),
                "paidAt" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id")
            );
        `);

        // ============== UPDATE LoanApplication with new fields ==============

        console.log('\nAdding new columns to LoanApplication...');
        
        await addColumn('LoanApplication', 'lanNumber', '"lanNumber" VARCHAR(100) UNIQUE');
        await addColumn('LoanApplication', 'lanEnteredAt', '"lanEnteredAt" TIMESTAMP(3)');
        await addColumn('LoanApplication', 'fileLoggedBy', '"fileLoggedBy" TEXT');
        await addColumn('LoanApplication', 'productId', '"productId" TEXT');
        await addColumn('LoanApplication', 'branchId', '"branchId" TEXT');
        await addColumn('LoanApplication', 'assignedOfficer', '"assignedOfficer" TEXT');
        await addColumn('LoanApplication', 'assignedStaffId', '"assignedStaffId" TEXT');
        await addColumn('LoanApplication', 'sanctionAmount', '"sanctionAmount" DOUBLE PRECISION');
        await addColumn('LoanApplication', 'sanctionDate', '"sanctionDate" TIMESTAMP(3)');
        await addColumn('LoanApplication', 'sanctionExpiry', '"sanctionExpiry" TIMESTAMP(3)');
        await addColumn('LoanApplication', 'sanctionLetterUrl', '"sanctionLetterUrl" TEXT');
        await addColumn('LoanApplication', 'roiType', '"roiType" VARCHAR(20)');
        await addColumn('LoanApplication', 'roiBase', '"roiBase" DOUBLE PRECISION');
        await addColumn('LoanApplication', 'roiEffective', '"roiEffective" DOUBLE PRECISION');
        await addColumn('LoanApplication', 'roiSubsidy', '"roiSubsidy" DOUBLE PRECISION');
        await addColumn('LoanApplication', 'priority', '"priority" VARCHAR(50) DEFAULT \'NORMAL\'');
        await addColumn('LoanApplication', 'turnaroundDays', '"turnaroundDays" INTEGER');
        await addColumn('LoanApplication', 'previousSubmissions', '"previousSubmissions" JSONB');
        await addColumn('LoanApplication', 'submissionAttempt', '"submissionAttempt" INTEGER DEFAULT 1');

        // ============== CREATE INDEXES ==============

        console.log('\nCreating performance indexes...');
        
        const createIndex = async (indexName, tableName, columns) => {
            try {
                await client.query(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}"(${columns})`);
                console.log(`  Index "${indexName}" created.`);
            } catch (err) {
                console.log(`  Index "${indexName}" already exists or error: ${err.message}`);
            }
        };

        await createIndex('idx_bankdecision_application', 'BankDecision', '"applicationId"');
        await createIndex('idx_bankdecision_bank', 'BankDecision', '"bankId"');
        await createIndex('idx_processingfee_application', 'ProcessingFee', '"applicationId"');
        await createIndex('idx_disbursement_application', 'Disbursement', '"applicationId"');
        await createIndex('idx_bankquery_application', 'BankQuery', '"applicationId"');
        await createIndex('idx_auditlog_entity', 'AuditLog', '"entityId", "entityType"');
        await createIndex('idx_bankproduct_bank', 'BankProduct', '"bankId"');
        await createIndex('idx_bankbranch_bank', 'BankBranch', '"bankId"');
        await createIndex('idx_loanapplication_lan', 'LoanApplication', '"lanNumber"');
        await createIndex('idx_loanapplication_product', 'LoanApplication', '"productId"');
        await createIndex('idx_loanapplication_branch', 'LoanApplication', '"branchId"');

        console.log('\n✅ All bank dashboard migrations executed successfully!');

    } catch (err) {
        console.error('❌ Fatal migration error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
