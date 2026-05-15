const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        const tables = ['StaffProfile', 'StaffProfileDocument', 'StaffProfileShare'];
        for (const tableName of tables) {
            const res = await client.query(`
                SELECT column_name, column_default, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${tableName}' AND column_name = 'id'
            `);
            if (res.rows.length > 0) {
                const idCol = res.rows[0];
                if (!idCol.column_default) {
                    console.log(`Table ${tableName} missing id default. Fixing...`);
                    await client.query(`ALTER TABLE "${tableName}" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
                } else {
                    console.log(`Table ${tableName} id is OK: ${idCol.column_default}`);
                }
            } else {
                console.log(`Table ${tableName} has no id column or does not exist.`);
            }
        }
        await client.query(`NOTIFY pgrst, 'reload schema'`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
