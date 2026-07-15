const { Client } = require('pg');
require('dotenv').config();

async function inspectApps() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT id, "applicationNumber", "evvOverall", "evvMonthlyBreakdown", "evvStatus" FROM "LoanApplication"');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
inspectApps();
