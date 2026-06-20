const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('./server/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

async function listUsers() {
    const connectionString = env.DIRECT_URL || env.DATABASE_URL;
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    console.log('--- Users ---');
    const resA = await client.query("SELECT id, email, role, \"firstName\", \"lastName\" FROM \"User\"");
    console.log(resA.rows);
    await client.end();
}
listUsers().catch(console.error);
