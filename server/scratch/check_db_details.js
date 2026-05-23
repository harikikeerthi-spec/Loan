const { Client } = require('pg');
require('dotenv').config();

async function checkDetails() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const tablesToCheck = [
        'BankProduct', 'BankBranch', 'BankDecision', 'ProcessingFee', 
        'Disbursement', 'BankQuery', 'QueryResponse', 'FileQualityRating', 
        'ConsentRecord', 'ReferralFee', 'AuditLog', 'LoanApplication', 'Bank'
    ];
    
    for (const tableName of tablesToCheck) {
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `, [tableName]);
        console.log(`=== Table: ${tableName} ===`);
        if (res.rows.length === 0) {
            console.log("Not found");
        } else {
            res.rows.forEach(r => {
                console.log(`  ${r.column_name}: ${r.data_type} (${r.is_nullable})`);
            });
        }
    }

    console.log("=== Bank Users ===");
    const usersRes = await client.query(`SELECT id, email, "firstName", "lastName", role FROM "User" WHERE role IN ('bank', 'partner_bank')`);
    console.log(usersRes.rows);

    console.log("=== Banks ===");
    const bankRes = await client.query(`SELECT * FROM "Bank" LIMIT 10`);
    console.log(bankRes.rows);

    await client.end();
}
checkDetails().catch(console.error);
