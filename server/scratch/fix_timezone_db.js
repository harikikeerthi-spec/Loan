const { Client } = require('pg');
require('dotenv').config();

async function fixTimezones() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    try {
        console.log("Altering column types to timestamptz...");
        
        // 1. ApplicationNote
        console.log(" - Altering ApplicationNote...");
        await client.query(`
            ALTER TABLE "ApplicationNote" 
            ALTER COLUMN "createdAt" TYPE timestamptz,
            ALTER COLUMN "updatedAt" TYPE timestamptz
        `);
        
        // 2. ApplicationStatusHistory
        console.log(" - Altering ApplicationStatusHistory...");
        await client.query(`
            ALTER TABLE "ApplicationStatusHistory" 
            ALTER COLUMN "createdAt" TYPE timestamptz
        `);
        
        // 3. ApplicationDocument
        console.log(" - Altering ApplicationDocument...");
        await client.query(`
            ALTER TABLE "ApplicationDocument" 
            ALTER COLUMN "uploadedAt" TYPE timestamptz,
            ALTER COLUMN "updatedAt" TYPE timestamptz
        `);
        
        console.log("Timezone columns successfully migrated to timestamptz!");
    } catch (err) {
        console.error("Timezone column migration failed. Error:", err.message);
    }
    
    await client.end();
}

fixTimezones().catch(console.error);
