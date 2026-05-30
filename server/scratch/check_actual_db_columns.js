const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const tables = ['BankProduct', 'BankBranch', 'OfficerTarget'];
        for (const table of tables) {
            console.log(`\nColumns for table "${table}":`);
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}';
            `);
            console.log(res.rows);
        }
    } catch (e) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
