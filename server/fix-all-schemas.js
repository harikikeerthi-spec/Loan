const { Client } = require('pg');
require('dotenv').config();

async function fixAllTableIds() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        
        const tables = [
            'User', 
            'LoanApplication', 
            'UserDocument', 
            'ForumPost', 
            'ForumComment', 
            'UniversityInquiry',
            'Blog',
            'AdminProfile',
            'AuditLog',
            'LoanEligibilityCheck',
            'VisaMockInterviewResult'
        ];

        for (const tableName of tables) {
            console.log(`Checking table: ${tableName}...`);
            const res = await client.query(`
                SELECT column_name, column_default, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${tableName}' AND column_name = 'id'
            `);

            if (res.rows.length === 0) {
                console.log(`  Table ${tableName} not found or has no id column.`);
                continue;
            }

            const idCol = res.rows[0];
            if (!idCol.column_default) {
                if (idCol.data_type === 'text' || idCol.data_type === 'uuid') {
                    console.log(`  Fixing missing default for ${tableName}.id (${idCol.data_type})`);
                    await client.query(`ALTER TABLE "${tableName}" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
                } else {
                    console.log(`  Skipping ${tableName}.id as type is ${idCol.data_type}`);
                }
            } else {
                console.log(`  Table ${tableName}.id already has default: ${idCol.column_default}`);
            }
        }

    } catch (err) {
        console.error('Error fixing tables:', err);
    } finally {
        await client.end();
    }
}

fixAllTableIds();
