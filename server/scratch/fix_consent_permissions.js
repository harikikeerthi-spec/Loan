const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log('Fixing permissions for ConsentRecord...');
    
    // Grant privileges
    await client.query(`GRANT ALL PRIVILEGES ON TABLE "ConsentRecord" TO postgres, anon, authenticated, service_role;`);
    console.log('Granted privileges to postgres, anon, authenticated, service_role on ConsentRecord');

    // Disable RLS
    await client.query(`ALTER TABLE "ConsentRecord" DISABLE ROW LEVEL SECURITY;`);
    console.log('Disabled RLS on ConsentRecord table');

    await client.end();
    console.log('Done.');
}

main().catch(console.error);
