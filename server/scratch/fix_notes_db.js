const { Client } = require('pg');
require('dotenv').config();

async function fixDatabaseSchema() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    try {
        console.log("Fixing database constraints...");
        
        // 1. ApplicationStatusHistory
        console.log(" - Altering ApplicationStatusHistory...");
        await client.query(`
            ALTER TABLE "ApplicationStatusHistory" 
            ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
        
        // 2. Notification
        console.log(" - Altering Notification...");
        await client.query(`
            ALTER TABLE "Notification" 
            ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
        `);
        
        // 3. ApplicationDocument
        console.log(" - Altering ApplicationDocument...");
        await client.query(`
            ALTER TABLE "ApplicationDocument" 
            ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
            ALTER COLUMN "fileName" SET DEFAULT '',
            ALTER COLUMN "filePath" SET DEFAULT '',
            ALTER COLUMN "updatedAt" SET DEFAULT now()
        `);
        
        console.log("Schema constraints successfully updated!");
    } catch (err) {
        console.error("Database constraint migration failed. Error:", err.message);
    }
    
    await client.end();
}

fixDatabaseSchema().catch(console.error);
