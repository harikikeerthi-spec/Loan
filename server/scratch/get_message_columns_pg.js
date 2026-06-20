const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('./server/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

async function listCols() {
    const connectionString = env.DIRECT_URL || env.DATABASE_URL;
    console.log("Connecting to:", connectionString.split('@')[1]);
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    console.log('--- Message ---');
    const resA = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Message'");
    console.log(resA.rows);
    await client.end();
}
listCols().catch(console.error);
