const { Client } = require('pg');
require('dotenv').config();

async function testInsert() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    try {
        console.log("Attempting insert into ApplicationStatusHistory without id...");
        const res = await client.query(
            `INSERT INTO "ApplicationStatusHistory" ("applicationId", "toStatus", "isAutomatic") 
             VALUES ($1, $2, $3) RETURNING *`,
            ['7f792af0-942a-420e-8aa5-9fd046471777', 'submitted', false]
        );
        console.log("Insert Success:", res.rows[0]);
    } catch (err) {
        console.error("Insert Failed:");
        console.error(" - Message:", err.message);
        console.error(" - Code:", err.code);
        console.error(" - Detail:", err.detail);
        console.error(" - Column:", err.column);
        console.error(" - Table:", err.table);
    }
    
    await client.end();
}

testInsert().catch(console.error);
