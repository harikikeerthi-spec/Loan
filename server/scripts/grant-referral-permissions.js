const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@13.239.87.90:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📦 Granting privileges on "Referral" and "ReferralVisit" tables...');
    await client.query('GRANT ALL PRIVILEGES ON TABLE "Referral" TO postgres, anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON TABLE "ReferralVisit" TO postgres, anon, authenticated, service_role;');
    console.log('✅ Privileges granted successfully.\n');

  } catch (err) {
    console.error('❌ Granting privileges failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
