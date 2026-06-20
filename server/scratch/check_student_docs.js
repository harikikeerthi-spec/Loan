const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('./server/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

async function listDocs() {
    const connectionString = env.DIRECT_URL || env.DATABASE_URL;
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    const appId = '25a193e9-4e81-4786-918c-dcc2de2a6023';
    console.log('--- Application Documents for App:', appId);
    const resA = await client.query("SELECT * FROM \"ApplicationDocument\" WHERE \"applicationId\" = $1", [appId]);
    console.log(resA.rows);
    
    // Get user id first
    const resApp = await client.query("SELECT \"userId\" FROM \"LoanApplication\" WHERE \"id\" = $1", [appId]);
    if (resApp.rows.length > 0) {
        const userId = resApp.rows[0].userId;
        console.log('--- User Documents for User:', userId);
        const resB = await client.query("SELECT * FROM \"UserDocument\" WHERE \"userId\" = $1", [userId]);
        console.log(resB.rows);
    }
    
    await client.end();
}
listDocs().catch(console.error);
