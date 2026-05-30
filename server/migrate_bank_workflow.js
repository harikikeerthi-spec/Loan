const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        // ============== CREATE BankSubmission TABLE ==============
        console.log('\nCreating BankSubmission table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankSubmission" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "applicationId" TEXT NOT NULL UNIQUE,
                "bankId" TEXT NOT NULL,
                "bankName" VARCHAR(255) NOT NULL,
                "submittedBy" TEXT NOT NULL,
                "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                -- Bank Workflow Status Tracking
                "workflowStatus" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED_TO_BANK',
                "currentStage" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED_TO_BANK',
                
                -- File Logging
                "lanNumber" VARCHAR(100) UNIQUE,
                "fileLoggedAt" TIMESTAMP(3),
                "fileLoggedBy" TEXT,
                
                -- Query Tracking
                "queriesRaised" INTEGER DEFAULT 0,
                "lastQueryAt" TIMESTAMP(3),
                "queryResponsePending" BOOLEAN DEFAULT FALSE,
                
                -- Decision Fields
                "decisionStatus" VARCHAR(50), -- SANCTIONED, CONDITIONAL_SANCTION, COUNTER_OFFER, REJECTED
                "decisionMadeAt" TIMESTAMP(3),
                "decisionMadeBy" TEXT,
                "decisionNotes" TEXT,
                
                -- Sanction Details
                "sanctionAmount" DOUBLE PRECISION,
                "sanctionDate" TIMESTAMP(3),
                "roiType" VARCHAR(20),
                "roiBase" DOUBLE PRECISION,
                "roiEffective" DOUBLE PRECISION,
                "roiSubsidy" DOUBLE PRECISION,
                "tenure" INTEGER,
                
                -- Conditional/Counter Details
                "conditions" JSONB, -- Array of conditions for CONDITIONAL_SANCTION
                "counterOfferDetails" JSONB, -- Counter offer terms
                "rejectionReason" TEXT,
                "rejectionCategory" VARCHAR(50), -- CREDIT, DOCUMENTS, INCOME, SECURITY, etc.
                
                -- Processing Fee
                "processingFeeAmount" DOUBLE PRECISION,
                "processingFeeStatus" VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, WAIVED, REFUNDED
                "processingFeePaidAt" TIMESTAMP(3),
                
                -- Disbursement
                "disbursementStatus" VARCHAR(50), -- PENDING, PROCESSING, COMPLETED
                "disbursementAmount" DOUBLE PRECISION,
                "disbursementDate" TIMESTAMP(3),
                "disbursementReferenceNo" VARCHAR(100),
                
                -- Resubmission
                "canResubmitToOtherBank" BOOLEAN DEFAULT FALSE,
                "resubmissionAttempts" INTEGER DEFAULT 0,
                "lastResubmittedAt" TIMESTAMP(3),
                
                -- Metadata
                "comments" TEXT,
                "statusHistory" JSONB DEFAULT '[]'::jsonb,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE
            );
        `);
        console.log('✓ BankSubmission table created');

        // ============== CREATE BankWorkflowHistory TABLE ==============
        console.log('\nCreating BankWorkflowHistory table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankWorkflowHistory" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "submissionId" TEXT NOT NULL,
                "applicationId" TEXT NOT NULL,
                "fromStatus" VARCHAR(50),
                "toStatus" VARCHAR(50) NOT NULL,
                "fromStage" VARCHAR(50),
                "toStage" VARCHAR(50) NOT NULL,
                "changedBy" TEXT NOT NULL,
                "changeReason" TEXT,
                "metadata" JSONB,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY ("submissionId") REFERENCES "BankSubmission"("id") ON DELETE CASCADE,
                FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE
            );
        `);
        console.log('✓ BankWorkflowHistory table created');

        // ============== CREATE BankWorkflowQueryRequest TABLE ==============
        console.log('\nCreating BankWorkflowQueryRequest table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS "BankWorkflowQueryRequest" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "submissionId" TEXT NOT NULL,
                "applicationId" TEXT NOT NULL,
                "queryType" VARCHAR(50) NOT NULL, -- DOCUMENT, INFORMATION, CLARIFICATION
                "queryDescription" TEXT NOT NULL,
                "raisedBy" TEXT NOT NULL,
                "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "dueDate" TIMESTAMP(3),
                "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, RESPONDED, RESOLVED, ESCALATED
                "response" TEXT,
                "respondedBy" TEXT,
                "respondedAt" TIMESTAMP(3),
                "attachments" JSONB DEFAULT '[]'::jsonb,
                "resolution" TEXT,
                "resolvedAt" TIMESTAMP(3),
                
                FOREIGN KEY ("submissionId") REFERENCES "BankSubmission"("id") ON DELETE CASCADE,
                FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE
            );
        `);
        console.log('✓ BankWorkflowQueryRequest table created');

        // ============== ALTER LoanApplication TABLE ==============
        console.log('\nUpdating LoanApplication table...');
        
        const addColumn = async (columnName, ddlType) => {
            try {
                const result = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' AND table_name = 'LoanApplication' AND column_name = $1
                    );
                `, [columnName]);
                
                if (!result.rows[0].exists) {
                    await client.query(`ALTER TABLE "LoanApplication" ADD COLUMN "${columnName}" ${ddlType}`);
                    console.log(`  ✓ Added column: ${columnName}`);
                } else {
                    console.log(`  • Column already exists: ${columnName}`);
                }
            } catch (err) {
                console.log(`  ! Error with ${columnName}: ${err.message}`);
            }
        };

        await addColumn('bankSubmissionId', 'TEXT');
        await addColumn('sharedWithBanks', 'JSONB DEFAULT \'[]\'::jsonb');
        await addColumn('bankWorkflowStatus', 'VARCHAR(50)');
        await addColumn('bankWorkflowStage', 'VARCHAR(50)');
        await addColumn('submittedToBankAt', 'TIMESTAMP(3)');

        // ============== CREATE INDEXES ==============
        console.log('\nCreating performance indexes...');
        
        const createIndex = async (indexName, tableName, columns) => {
            try {
                await client.query(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}"(${columns})`);
                console.log(`  ✓ Index created: ${indexName}`);
            } catch (err) {
                console.log(`  • Index exists or error: ${err.message}`);
            }
        };

        await createIndex('idx_banksubmission_application', 'BankSubmission', '"applicationId"');
        await createIndex('idx_banksubmission_bank', 'BankSubmission', '"bankId"');
        await createIndex('idx_banksubmission_status', 'BankSubmission', '"workflowStatus"');
        await createIndex('idx_bankworkflow_history_submission', 'BankWorkflowHistory', '"submissionId"');
        await createIndex('idx_bankworkflow_history_application', 'BankWorkflowHistory', '"applicationId"');
        await createIndex('idx_bankworkflow_query_submission', 'BankWorkflowQueryRequest', '"submissionId"');
        await createIndex('idx_bankworkflow_query_status', 'BankWorkflowQueryRequest', '"status"');
        await createIndex('idx_loanapp_banksubmission', 'LoanApplication', '"bankSubmissionId"');
        await createIndex('idx_loanapp_workflow_status', 'LoanApplication', '"bankWorkflowStatus"');

        console.log('\n✓ All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
