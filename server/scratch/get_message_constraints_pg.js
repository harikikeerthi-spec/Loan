const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('./server/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

async function listConstraints() {
    const connectionString = env.DIRECT_URL || env.DATABASE_URL;
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    console.log('--- Message Constraints ---');
    const resA = await client.query(`
        SELECT conname, pg_get_constraintdef(c.oid) 
        FROM pg_constraint c 
        JOIN pg_namespace n ON n.oid = c.connamespace 
        WHERE conrelid = 'public."Message"'::regclass;
    `);
    console.log(resA.rows);
    await client.end();
}
listConstraints().catch(console.error);
