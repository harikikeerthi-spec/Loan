const { Client } = require('pg');
require('dotenv').config();

async function checkAllSchemas() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const tables = ['User', 'OnboardingApplication', 'UserAcademicProfile', 'UserFinancialProfile', 'UserStudyPreference', 'StaffProfile'];
    for (const table of tables) {
        console.log(`\n=== Table: ${table} ===`);
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
            ORDER BY ordinal_position
        `);
        if (res.rows.length === 0) {
            console.log('No columns found or table does not exist.');
        } else {
            console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
        }
    }

    await client.end();
}

checkAllSchemas().catch(console.error);
