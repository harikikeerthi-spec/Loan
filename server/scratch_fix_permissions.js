const { Client } = require('pg');
require('dotenv').config();

async function fixPermissions() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    try {
        console.log('Granting permissions...');
        await client.query('GRANT ALL PRIVILEGES ON TABLE "OnboardingDraft" TO postgres, anon, authenticated, service_role;');
        console.log('Permissions granted successfully.');
        
        // Let's also check if the table actually exists
        const res = await client.query('SELECT * FROM "OnboardingDraft" LIMIT 1');
        console.log('Sample row:', res.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
fixPermissions();
