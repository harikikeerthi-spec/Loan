const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT COUNT(*) FROM "Referral"');
    console.log('Referral count:', res.rows[0].count);
  } catch (e) {
    console.error('Referral check failed:', e.message);
  }
  try {
    const res = await client.query('SELECT COUNT(*) FROM "ReferralVisit"');
    console.log('ReferralVisit count:', res.rows[0].count);
  } catch (e) {
    console.error('ReferralVisit check failed:', e.message);
  }
  await client.end();
}
main().catch(console.error);
