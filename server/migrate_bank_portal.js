const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL for Bank Portal Schema Migrations...');

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

        // Table 1: lan_records
        await createTable('lan_records', `
            CREATE TABLE "lan_records" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "lanNumber" VARCHAR(100) NOT NULL,
                "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "assignedBy" TEXT NOT NULL,
                CONSTRAINT "lan_records_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 2: sanction_letters
        await createTable('sanction_letters', `
            CREATE TABLE "sanction_letters" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "fileName" TEXT NOT NULL,
                "filePath" TEXT NOT NULL,
                "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "issuedBy" TEXT NOT NULL,
                "expiryDate" TIMESTAMP(3),
                CONSTRAINT "sanction_letters_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 3: document_checklists
        await createTable('document_checklists', `
            CREATE TABLE "document_checklists" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "productId" TEXT,
                "docType" TEXT NOT NULL,
                "docName" TEXT NOT NULL,
                "isRequired" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "document_checklists_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 4: document_versions
        await createTable('document_versions', `
            CREATE TABLE "document_versions" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "documentId" TEXT NOT NULL,
                "versionNumber" INTEGER NOT NULL,
                "filePath" TEXT NOT NULL,
                "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 5: query_attachments
        await createTable('query_attachments', `
            CREATE TABLE "query_attachments" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "queryId" TEXT NOT NULL,
                "fileName" TEXT NOT NULL,
                "filePath" TEXT NOT NULL,
                "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "query_attachments_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 6: sanctions
        await createTable('sanctions', `
            CREATE TABLE "sanctions" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "sanctionAmount" DOUBLE PRECISION NOT NULL,
                "interestRate" DOUBLE PRECISION NOT NULL,
                "tenure" INTEGER NOT NULL,
                "sanctionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "status" TEXT NOT NULL DEFAULT 'active',
                CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 7: conditional_sanctions
        await createTable('conditional_sanctions', `
            CREATE TABLE "conditional_sanctions" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "conditionsList" JSONB NOT NULL,
                "deadline" TIMESTAMP(3) NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "conditional_sanctions_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 8: counter_offers
        await createTable('counter_offers', `
            CREATE TABLE "counter_offers" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "offeredAmount" DOUBLE PRECISION NOT NULL,
                "offeredRate" DOUBLE PRECISION NOT NULL,
                "offeredTenure" INTEGER NOT NULL,
                "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "status" TEXT NOT NULL DEFAULT 'pending',
                CONSTRAINT "counter_offers_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 9: rejections
        await createTable('rejections', `
            CREATE TABLE "rejections" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "reason" TEXT NOT NULL,
                "rejectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "rejections_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 10: partial_sanctions
        await createTable('partial_sanctions', `
            CREATE TABLE "partial_sanctions" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "sanctionAmount" DOUBLE PRECISION NOT NULL,
                "shortfallAmount" DOUBLE PRECISION NOT NULL,
                "reason" TEXT,
                CONSTRAINT "partial_sanctions_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 11: roi_records
        await createTable('roi_records', `
            CREATE TABLE "roi_records" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "productId" TEXT,
                "minRate" DOUBLE PRECISION NOT NULL,
                "maxRate" DOUBLE PRECISION NOT NULL,
                "type" VARCHAR(50) NOT NULL DEFAULT 'floating',
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "roi_records_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 12: processing_fees
        await createTable('processing_fees', `
            CREATE TABLE "processing_fees" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "feeAmount" DOUBLE PRECISION NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "processing_fees_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 13: disbursements
        await createTable('disbursements', `
            CREATE TABLE "disbursements" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "disbursementAmount" DOUBLE PRECISION NOT NULL,
                "trancheNumber" INTEGER NOT NULL DEFAULT 1,
                "transferMode" VARCHAR(50) NOT NULL DEFAULT 'NEFT',
                "utrNumber" VARCHAR(100) NOT NULL,
                "disbursedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 14: commissions
        await createTable('commissions', `
            CREATE TABLE "commissions" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "commissionAmount" DOUBLE PRECISION NOT NULL,
                "payoutStatus" VARCHAR(50) NOT NULL DEFAULT 'pending',
                "agentId" TEXT,
                "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 15: referral_fees
        await createTable('referral_fees', `
            CREATE TABLE "referral_fees" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "referralFeeAmount" DOUBLE PRECISION NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
                "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "referral_fees_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 16: bank_products
        await createTable('bank_products', `
            CREATE TABLE "bank_products" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "productName" TEXT NOT NULL,
                "description" TEXT,
                "minAmount" DOUBLE PRECISION NOT NULL,
                "maxAmount" DOUBLE PRECISION NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "bank_products_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 17: branches
        await createTable('branches', `
            CREATE TABLE "branches" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "bankId" TEXT NOT NULL,
                "branchName" TEXT NOT NULL,
                "city" TEXT NOT NULL,
                "address" TEXT,
                CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 18: bank_users
        await createTable('bank_users', `
            CREATE TABLE "bank_users" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "userId" TEXT NOT NULL,
                "bankId" TEXT NOT NULL,
                "role" VARCHAR(50) NOT NULL DEFAULT 'Officer',
                CONSTRAINT "bank_users_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 19: bank_roles
        await createTable('bank_roles', `
            CREATE TABLE "bank_roles" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "roleName" VARCHAR(50) NOT NULL,
                "permissions" JSONB NOT NULL,
                CONSTRAINT "bank_roles_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 20: queries
        await createTable('queries', `
            CREATE TABLE "queries" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "authorId" TEXT,
                "authorName" TEXT NOT NULL,
                "content" TEXT NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'open',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "queries_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 21: query_threads
        await createTable('query_threads', `
            CREATE TABLE "query_threads" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "queryId" TEXT NOT NULL,
                "senderId" TEXT,
                "senderName" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "query_threads_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 22: chat_messages
        await createTable('chat_messages', `
            CREATE TABLE "chat_messages" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "senderId" TEXT NOT NULL,
                "recipientId" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 23: file_quality_scores
        await createTable('file_quality_scores', `
            CREATE TABLE "file_quality_scores" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "rating" DOUBLE PRECISION NOT NULL,
                "feedback" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "file_quality_scores_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 24: sla_metrics
        await createTable('sla_metrics', `
            CREATE TABLE "sla_metrics" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "stage" VARCHAR(100) NOT NULL,
                "tatDays" DOUBLE PRECISION NOT NULL,
                "slaMet" BOOLEAN NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "sla_metrics_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 25: rejection_reasons
        await createTable('rejection_reasons', `
            CREATE TABLE "rejection_reasons" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "reasonCode" VARCHAR(100) NOT NULL,
                "category" VARCHAR(100) NOT NULL,
                "description" TEXT,
                CONSTRAINT "rejection_reasons_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 26: consent_records
        await createTable('consent_records', `
            CREATE TABLE "consent_records" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "userId" TEXT NOT NULL,
                "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "purpose" TEXT NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
            );
        `);

        // Table 27: data_access_logs
        await createTable('data_access_logs', `
            CREATE TABLE "data_access_logs" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "accessedBy" TEXT NOT NULL,
                "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "applicationId" TEXT NOT NULL,
                "action" TEXT NOT NULL,
                CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('All migrations executed successfully.');

    } catch (err) {
        console.error('Fatal migration error:', err);
    } finally {
        await client.end();
    }
}

runMigration();
