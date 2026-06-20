const { Client } = require('pg');
require('dotenv').config();

async function queryStaff() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('--- User with firstName Jean ---');
        const res = await client.query('SELECT * FROM "User" WHERE "firstName" ILIKE \'%Jean%\' OR "email" ILIKE \'%jean%\'');
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('--- All Staff / Admin / Support Users ---');
        const res2 = await client.query('SELECT id, email, "firstName", "lastName", role FROM "User" WHERE role IN (\'staff\', \'admin\', \'support\', \'super_admin\')');
        console.log(JSON.stringify(res2.rows, null, 2));
    } catch (e) {
        console.error('Error querying users:', e);
    } finally {
        await client.end();
    }
}
queryStaff();
