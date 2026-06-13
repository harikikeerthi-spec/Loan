const { Client } = require('pg');
require('dotenv').config();

async function checkApp() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log("Checking application VL-APP-2026-00019...");
    const res = await client.query('SELECT * FROM "LoanApplication" WHERE "applicationNumber" = $1', ['VL-APP-2026-00019']);
    if (res.rows.length > 0) {
        const app = res.rows[0];
        console.log("Application details:", {
            id: app.id,
            status: app.status,
            stage: app.stage,
            progress: app.progress,
            date: app.date,
            createdAt: app.createdAt,
            submittedAt: app.submittedAt,
            updatedAt: app.updatedAt
        });
        
        console.log("\nStatus History:");
        const resHistory = await client.query('SELECT * FROM "ApplicationStatusHistory" WHERE "applicationId" = $1 ORDER BY "createdAt" ASC', [app.id]);
        resHistory.rows.forEach(h => {
            console.log(` - From: ${h.fromStatus}/${h.fromStage} -> To: ${h.toStatus}/${h.toStage} at ${h.createdAt} (notes: ${h.notes})`);
        });
    } else {
        console.log("Application not found.");
    }
    
    await client.end();
}

checkApp().catch(console.error);
