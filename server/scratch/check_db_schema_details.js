const { Client } = require('pg');
require('dotenv').config();

async function checkDatabaseSchema() {
    const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    try {
        await client.connect();
        
        const tables = ['User', 'OnboardingApplication', 'UserStudyPreference', 'UserAcademicProfile', 'UserFinancialProfile'];
        
        for (const table of tables) {
            console.log(`\n=================== ${table} Columns ===================`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY column_name
            `, [table]);
            
            if (res.rows.length === 0) {
                console.log(`❌ Table '${table}' not found or has no columns.`);
            } else {
                res.rows.forEach(row => {
                    console.log(`- ${row.column_name.padEnd(25)} : ${row.data_type.padEnd(20)} (Nullable: ${row.is_nullable})`);
                });
            }
        }
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

checkDatabaseSchema();
