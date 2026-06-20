const { Client } = require('pg');
const fs = require('fs');

const env = {};
try {
  fs.readFileSync('./server/.env', 'utf-8').split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && key.trim()) env[key.trim()] = values.join('=').trim();
  });
} catch (e) {
  try {
    fs.readFileSync('./.env', 'utf-8').split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && key.trim()) env[key.trim()] = values.join('=').trim();
    });
  } catch (err) {}
}

async function listCols() {
    const client = new Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL });
    await client.connect();
    
    console.log('--- Message ---');
    const resA = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Message'");
    console.log(resA.rows);
    
    console.log('--- Conversation ---');
    const resB = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Conversation'");
    console.log(resB.rows);
    
    await client.end();
}
listCols().catch(console.error);
