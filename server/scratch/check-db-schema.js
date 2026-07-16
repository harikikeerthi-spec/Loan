const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@13.239.87.90:5432/postgres";

async function checkSchema() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('All tables:', tableRes.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
