const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const res = await client.query(
        'SELECT id, "createdAt" FROM "ApplicationNote" WHERE "applicationId" = $1 ORDER BY "createdAt" DESC LIMIT 5',
        ['7f792af0-942a-420e-8aa5-9fd046471777']
    );
    console.log("Raw Database Rows:");
    res.rows.forEach(row => {
        console.log(` - ID: ${row.id}, createdAt: ${row.createdAt} (type: ${typeof row.createdAt})`);
        if (row.createdAt instanceof Date) {
            console.log(`   - ISOString: ${row.createdAt.toISOString()}`);
            console.log(`   - UTCString: ${row.createdAt.toUTCString()}`);
        }
    });
    
    await client.end();
}
run().catch(console.error);
