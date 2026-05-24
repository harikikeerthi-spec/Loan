const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL for FileEntry & FileDocument Schema Migrations...');

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

        // ============== CREATE FileEntry TABLE ==============
        await createTable('FileEntry', `
            CREATE TABLE "FileEntry" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" TEXT NOT NULL,
                "bankId" TEXT NOT NULL,
                "fileName" VARCHAR(255) NOT NULL,
                "category" VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
                "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
                "createdBy" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id"),
                FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE
            );
        `);

        // ============== CREATE FileDocument TABLE ==============
        await createTable('FileDocument', `
            CREATE TABLE "FileDocument" (
                "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
                "fileId" TEXT NOT NULL,
                "documentType" VARCHAR(100) NOT NULL,
                "fileName" VARCHAR(255) NOT NULL,
                "fileUrl" TEXT NOT NULL,
                "fileSize" DOUBLE PRECISION,
                "uploadedBy" TEXT NOT NULL,
                "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("id"),
                FOREIGN KEY ("fileId") REFERENCES "FileEntry"("id") ON DELETE CASCADE
            );
        `);

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

        await createIndex('idx_fileentry_application', 'FileEntry', '"applicationId"');
        await createIndex('idx_fileentry_bank', 'FileEntry', '"bankId"');
        await createIndex('idx_fileentry_status', 'FileEntry', '"status"');
        await createIndex('idx_filedocument_file', 'FileDocument', '"fileId"');

        // ============== GRANT PRIVILEGES ==============
        console.log('\nGranting database privileges for REST API roles...');
        await client.query('GRANT ALL PRIVILEGES ON TABLE "FileEntry" TO postgres, anon, authenticated, service_role;');
        await client.query('GRANT ALL PRIVILEGES ON TABLE "FileDocument" TO postgres, anon, authenticated, service_role;');
        console.log('  Privileges granted on FileEntry and FileDocument.');

        console.log('\n✅ All migrations executed successfully!');

    } catch (err) {
        console.error('❌ Fatal migration error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
