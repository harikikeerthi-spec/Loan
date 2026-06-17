const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const res = await client.query('SELECT email, role FROM "User"');
    console.log('All Users count:', res.rows.length);
    const roleCounts = {};
    for (const row of res.rows) {
        roleCounts[row.role] = (roleCounts[row.role] || 0) + 1;
    }
    console.log('Role counts:', roleCounts);
    console.log('Admin users:', res.rows.filter(r => r.role === 'admin' || r.role === 'super_admin'));
    await client.end();
}

main().catch(console.error);
