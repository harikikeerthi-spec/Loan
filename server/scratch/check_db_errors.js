const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL DB.');

    const getCols = async (tbl) => {
      const res = await client.query(`
        SELECT column_name, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1;
      `, [tbl]);
      console.log(`\n=== Columns for ${tbl} ===`);
      console.table(res.rows);
    };

    await getCols('ProcessingFee');
    await getCols('Message');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
