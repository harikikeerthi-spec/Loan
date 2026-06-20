const { Client } = require('pg');
require('dotenv').config();

async function checkRLS() {
    const client = new Client({ 
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('--- RLS Policies on Message ---');
        const res = await client.query('SELECT * FROM pg_policies WHERE tablename = \'Message\'');
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('--- RLS Status of Message ---');
        const resStatus = await client.query('SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = \'Message\'');
        console.log(JSON.stringify(resStatus.rows, null, 2));
    } catch (e) {
        console.error('Error checking RLS:', e);
    } finally {
        await client.end();
    }
}
checkRLS();
