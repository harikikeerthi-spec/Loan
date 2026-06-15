const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    // Find application for Teja K
    const appRes = await client.query(`
        SELECT id, "applicationNumber", "userId", "firstName", "lastName" 
        FROM "LoanApplication" 
        WHERE "firstName" ILIKE '%Teja%' OR "lastName" ILIKE '%Teja%'
    `);
    console.log("Applications for Teja:", appRes.rows);
    
    for (const app of appRes.rows) {
        console.log(`\n--- Checking Application ${app.applicationNumber} (ID: ${app.id}, UserID: ${app.userId}) ---`);
        
        // Get application documents
        const docsRes = await client.query(`
            SELECT id, "docType", "docName", "filePath", "status" 
            FROM "ApplicationDocument" 
            WHERE "applicationId" = $1
        `, [app.id]);
        console.log("ApplicationDocuments:", docsRes.rows);
        
        if (app.userId) {
            // Get user documents (vault)
            const vaultRes = await client.query(`
                SELECT id, "docType", "filePath", "status", "uploaded" 
                FROM "UserDocument" 
                WHERE "userId" = $1
            `, [app.userId]);
            console.log("UserDocuments (Vault):", vaultRes.rows);
        }
    }
    
    await client.end();
}
run().catch(console.error);
