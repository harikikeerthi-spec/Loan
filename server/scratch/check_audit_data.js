const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    // Check a sample of audit log entries
    const res = await client.query(`
        SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10
    `);
    console.log(`\n=== AuditLog sample (${res.rows.length} rows) ===`);
    for (const row of res.rows) {
        console.log(JSON.stringify(row, null, 2));
    }

    // Count total
    const countRes = await client.query(`SELECT count(*) FROM "AuditLog"`);
    console.log(`\nTotal AuditLog rows: ${countRes.rows[0].count}`);

    // Check distinct actions
    const actionsRes = await client.query(`SELECT DISTINCT action FROM "AuditLog"`);
    console.log(`\nDistinct actions:`, actionsRes.rows.map(r => r.action));

    // Check distinct entityTypes
    const typesRes = await client.query(`SELECT DISTINCT "entityType" FROM "AuditLog"`);
    console.log(`\nDistinct entityTypes:`, typesRes.rows.map(r => r.entityType));

    // Check related tables for a sample applicationId
    const appRes = await client.query(`SELECT id FROM "LoanApplication" LIMIT 1`);
    if (appRes.rows.length > 0) {
        const appId = appRes.rows[0].id;
        console.log(`\n=== Sample application: ${appId} ===`);

        const auditRes = await client.query(`SELECT * FROM "AuditLog" WHERE "entityId" = $1 ORDER BY "createdAt"`, [appId]);
        console.log(`AuditLog entries: ${auditRes.rows.length}`);
        
        const queryRes = await client.query(`SELECT id, "queryType", status, "raisedAt", "resolvedAt" FROM "BankQuery" WHERE "applicationId" = $1`, [appId]);
        console.log(`BankQuery entries: ${queryRes.rows.length}`);
        
        const decisionRes = await client.query(`SELECT id, decision, "decidedAt" FROM "BankDecision" WHERE "applicationId" = $1`, [appId]);
        console.log(`BankDecision entries: ${decisionRes.rows.length}`);

        const disbRes = await client.query(`SELECT id, amount, status, "disbursedAt" FROM "Disbursement" WHERE "applicationId" = $1`, [appId]);
        console.log(`Disbursement entries: ${disbRes.rows.length}`);

        const feeRes = await client.query(`SELECT id, status, "createdAt" FROM "ProcessingFee" WHERE "applicationId" = $1`, [appId]);
        console.log(`ProcessingFee entries: ${feeRes.rows.length}`);
    }

    await client.end();
}

checkData().catch(console.error);
