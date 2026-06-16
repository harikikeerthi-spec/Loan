const { Client } = require('pg');
require('dotenv').config();

async function testInsert() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    try {
        console.log("Attempting insert without id...");
        const res = await client.query(
            `INSERT INTO "ApplicationNote" ("applicationId", "authorId", "authorName", "content", "type", "isInternal") 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            ['7f792af0-942a-420e-8aa5-9fd046471777', 'some-author-id', 'Test Author', 'Test Content', 'general', false]
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
