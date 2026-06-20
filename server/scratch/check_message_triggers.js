const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('./server/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

async function listTriggers() {
    const connectionString = env.DIRECT_URL || env.DATABASE_URL;
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    console.log('--- Message Triggers ---');
    const resA = await client.query(`
        SELECT tgname, pg_get_triggerdef(oid) 
        FROM pg_trigger 
        WHERE tgrelid = 'public."Message"'::regclass;
    `);
    console.log(resA.rows);
    
    console.log('--- Message RLS Enablement ---');
    const resB = await client.query(`
        SELECT relname, relrowsecurity, relforcerowsecurity 
        FROM pg_class 
        WHERE oid = 'public."Message"'::regclass;
    `);
    console.log(resB.rows);

    await client.end();
}
listTriggers().catch(console.error);
