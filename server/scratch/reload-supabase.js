const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@13.239.87.90:5432/postgres";

async function reload() {
  const pool = new Pool({ connectionString });
  console.log('Connecting to PostgreSQL...');
  const client = await pool.connect();
  try {
    console.log('Sending schema reload notification to PostgREST...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Reload notification sent successfully!');
  } catch (err) {
    console.error('Error reloading schema cache:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

reload();
