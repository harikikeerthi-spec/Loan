const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // 1. Rename "Referral" to "referrals" if it exists
    console.log('📦 Renaming "Referral" table to "referrals" if it exists...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Referral'
      );
    `);

    if (tableExists.rows[0].exists) {
      await client.query('ALTER TABLE "Referral" RENAME TO "referrals";');
      console.log('✅ Table "Referral" renamed to "referrals".');

      // Rename constraints in separate try-catches
      try {
        await client.query('ALTER TABLE "referrals" RENAME CONSTRAINT "Referral_pkey" TO "referrals_pkey";');
        console.log('✅ Renamed PKEY constraint.');
      } catch (e) {
        console.log('ℹ️ PKEY constraint rename skipped:', e.message);
      }

      try {
        await client.query('ALTER TABLE "referrals" RENAME CONSTRAINT "Referral_refereeId_fkey" TO "referrals_refereeId_fkey";');
        console.log('✅ Renamed refereeId constraint.');
      } catch (e) {
        console.log('ℹ️ refereeId constraint rename skipped:', e.message);
      }

      try {
        await client.query('ALTER TABLE "referrals" RENAME CONSTRAINT "Referral_referrerId_fkey" TO "referrals_referrerId_fkey";');
        console.log('✅ Renamed referrerId constraint.');
      } catch (e) {
        console.log('ℹ️ referrerId constraint rename skipped:', e.message);
      }
    } else {
      console.log('ℹ️ Table "Referral" does not exist (already renamed).');
    }

    // 2. Add "updatedAt" to "referrals" if not exists
    console.log('📦 Adding "updatedAt" column to "referrals" if needed...');
    await client.query(`
      ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ Column check done.\n');

    // 3. Create "referral_codes" table
    console.log('📦 Creating "referral_codes" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "referral_codes" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "code" TEXT UNIQUE NOT NULL,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ "referral_codes" table ready.\n');

    // 4. Create "referral_audit_log" table
    console.log('📦 Creating "referral_audit_log" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "referral_audit_log" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "referralId" UUID NOT NULL REFERENCES "referrals"("id") ON DELETE CASCADE,
        "previousStatus" TEXT NOT NULL,
        "newStatus" TEXT NOT NULL,
        "changedBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "reason" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ "referral_audit_log" table ready.\n');

    // 5. Populate "referral_codes" table from existing "User" table records
    console.log('📦 Syncing existing user referral codes to "referral_codes"...');
    const syncRes = await client.query(`
      INSERT INTO "referral_codes" ("code", "userId")
      SELECT "referralCode", "id" FROM "User"
      WHERE "referralCode" IS NOT NULL
      ON CONFLICT ("userId") DO NOTHING;
    `);
    console.log(`✅ Synced existing user codes (inserted ${syncRes.rowCount} rows).\n`);

    // 6. Grant privileges on all new tables
    console.log('📦 Granting privileges on referral tables...');
    await client.query('GRANT ALL PRIVILEGES ON TABLE "referrals" TO postgres, anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON TABLE "referral_codes" TO postgres, anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON TABLE "referral_audit_log" TO postgres, anon, authenticated, service_role;');
    console.log('✅ Privileges granted.\n');

    // 7. Verify tables exist
    console.log('🔍 Verifying table existence...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('referrals', 'referral_codes', 'referral_audit_log');
    `);
    console.log('Tables present in DB:', tables.rows.map(r => r.table_name));

  } catch (err) {
    console.error('❌ Migration failed:', err.message, err.stack);
  } finally {
    await client.end();
  }
}

run();
