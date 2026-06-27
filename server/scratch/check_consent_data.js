const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    const tables = ['ConsentRecord', 'consent_records', 'StudentBankConsent'];
    for (const table of tables) {
        try {
            const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`Table '${table}' has ${res.rows[0].count} rows`);
            if (parseInt(res.rows[0].count) > 0) {
                const sample = await client.query(`SELECT * FROM "${table}" LIMIT 1`);
                console.log(`Sample from ${table}:`, sample.rows[0]);
            }
        } catch (e) {
            console.error(`Error querying ${table}:`, e.message);
        }
    }

    await client.end();
}

main().catch(console.error);
