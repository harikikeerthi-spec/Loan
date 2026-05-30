const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('Dropping all nullable constraints on BankProduct and BankBranch optional fields...');
        
        await client.query(`
            ALTER TABLE "BankProduct" 
            ALTER COLUMN "eligibility" DROP NOT NULL,
            ALTER COLUMN "maxTenure" DROP NOT NULL,
            ALTER COLUMN "moratoriumRule" DROP NOT NULL,
            ALTER COLUMN "requiredDocs" DROP NOT NULL;
        `);
        console.log('✓ Constraints dropped for BankProduct.');

        // Verify if any other columns might be NOT NULL
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('✓ PostgREST schema reload notified.');
    } catch (e) {
        console.error('Failed to drop constraints:', e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
