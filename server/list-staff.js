
require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT email, role 
            FROM "User" 
            WHERE role IN ('admin', 'super_admin', 'staff', 'bank', 'partner_bank')
        `);
        console.log('--- Elevated Users ---');
        console.table(res.rows);
        console.log('------------------------');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

main();
