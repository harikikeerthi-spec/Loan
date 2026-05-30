const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('Dropping NOT NULL constraints from BankProduct columns...');
        await client.query(`
            ALTER TABLE "BankProduct" 
            ALTER COLUMN "minAmount" DROP NOT NULL,
            ALTER COLUMN "maxAmount" DROP NOT NULL,
            ALTER COLUMN "roiMin" DROP NOT NULL,
            ALTER COLUMN "roiMax" DROP NOT NULL;
        `);
        console.log('✓ Constraints dropped.');
        
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('✓ PostgREST schema reload notified.');
    } catch (e) {
        console.error('Failed to drop constraints:', e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
