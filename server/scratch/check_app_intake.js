const { Client } = require('pg');
require('dotenv').config();

async function checkAppIntake() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    // Find application
    const appRes = await client.query(`
        SELECT * FROM "LoanApplication" 
        WHERE "applicationNumber" = 'VL-APP-2026-00031'
    `);

    if (appRes.rows.length === 0) {
        console.log("No application found with ID VL-APP-2026-00031");
        await client.end();
        return;
    }

    const app = appRes.rows[0];
    console.log("\n=================== Application Details ===================");
    console.log(" - id:", app.id);
    console.log(" - userId:", app.userId);
    console.log(" - loanType:", app.loanType);
    console.log(" - amount:", app.amount);

    // Log all fields from LoanApplication that might contain intake/dates
    Object.keys(app).forEach(key => {
        const val = app[key];
        if (key.toLowerCase().includes('intake') || key.toLowerCase().includes('date') || key.toLowerCase().includes('season') || key.toLowerCase().includes('country') || key.toLowerCase().includes('destination')) {
            console.log(` - app.${key}:`, val);
        }
    });

    if (app.userId) {
        // Query User details
        const userRes = await client.query(`
            SELECT * FROM "User" WHERE id = $1
        `, [app.userId]);

        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            console.log("\n=================== User Profile Details ===================");
            Object.keys(user).forEach(key => {
                const val = user[key];
                if (key.toLowerCase().includes('intake') || key.toLowerCase().includes('date') || key.toLowerCase().includes('season') || key.toLowerCase().includes('country') || key.toLowerCase().includes('destination')) {
                    console.log(` - user.${key}:`, val);
                }
            });
        }
    }

    await client.end();
}

checkAppIntake().catch(console.error);
