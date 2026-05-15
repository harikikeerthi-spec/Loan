const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        const res = await client.query(`
            SELECT column_name, column_default, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name = 'id'
        `);
        console.log(res.rows);
        
        // Also let's try an insert to be absolutely sure
        try {
            const insertRes = await client.query(`
                INSERT INTO "User" ("email", "firstName") VALUES ('test_insert_id_issue@example.com', 'Test') RETURNING id
            `);
            console.log('Insert successful:', insertRes.rows);
            
            // cleanup
            await client.query(`DELETE FROM "User" WHERE email = 'test_insert_id_issue@example.com'`);
        } catch (e) {
            console.error('Insert error:', e.message);
        }

    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

run();
