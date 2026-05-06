const { Client } = require('pg');

const connectionString = "postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
  connectionString: connectionString,
});

async function test() {
  try {
    console.log('Connecting to port 5432...');
    await client.connect();
    console.log('Successfully connected to 5432!');
    await client.end();
  } catch (err) {
    console.error('Failed to connect to 5432:', err.message);
  }
}

test();
