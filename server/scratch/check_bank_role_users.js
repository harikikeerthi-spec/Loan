const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query("SELECT id, email, role, \"firstName\", \"lastName\" FROM \"User\" WHERE role IN ('bank', 'partner_bank', 'admin', 'staff', 'super_admin') OR email IN ('farmatech@gmail.com', 'ropayi2211@aspensif.com', 'keerthichinnu0728@gmail.com')");
    console.log('Special users:', res.rows);
    
    const countRes = await client.query("SELECT COUNT(*), bank FROM \"LoanApplication\" GROUP BY bank");
    console.log('Applications by bank:', countRes.rows);

    const fileCountRes = await client.query("SELECT COUNT(*), \"bankId\" FROM \"FileEntry\" GROUP BY \"bankId\"");
    console.log('FileEntries by bankId:', fileCountRes.rows);

    const statusCountRes = await client.query("SELECT COUNT(*), status FROM \"LoanApplication\" GROUP BY status");
    console.log('Applications by status:', statusCountRes.rows);

    const userRoleCounts = await client.query("SELECT COUNT(*), role FROM \"User\" GROUP BY role");
    console.log('Users by role:', userRoleCounts.rows);

    await client.end();
}
check().catch(console.error);
