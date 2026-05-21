const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const tables = [
      'Disbursement', 'BankDecision', 'BankQuery', 'QueryResponse', 
      'ProcessingFee', 'FileQualityRating', 'ReferralFee', 'BankProduct', 'BankBranch'
    ];

    console.log('Granting privileges on bank-related tables...');
    for (const table of tables) {
        try {
            await client.query(`GRANT ALL PRIVILEGES ON TABLE "${table}" TO postgres, anon, authenticated, service_role;`);
            console.log(`- Privileges granted for table: ${table}`);
        } catch (e) {
            console.error(`- Error granting privileges for table ${table}:`, e.message);
        }
    }

    await client.end();
    console.log('Done.');
}

main().catch(console.error);
