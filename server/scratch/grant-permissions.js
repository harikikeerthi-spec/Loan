const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@13.239.87.90:5432/postgres";

async function grantPrivileges() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL as superuser...');
    
    // Grant privileges on all existing tables in public schema
    console.log('Granting privileges on all tables in public schema...');
    await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;');
    
    // Grant privileges on all sequences (for auto-increment ids)
    console.log('Granting privileges on all sequences...');
    await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;');
    
    // Alter default privileges so future tables also get these grants
    console.log('Altering default privileges for future tables...');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO postgres, anon, authenticated, service_role;');
    
    // Notify PostgREST to reload cache
    console.log('Notifying PostgREST...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    
    console.log('All privileges granted and schema reloaded successfully!');
  } catch (err) {
    console.error('Error granting privileges:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

grantPrivileges();
