const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const db = createClient(supabaseUrl, supabaseKey);

async function check() {
  const userId = 'VL-STU-2026-00044';
  try {
    console.log('1. Checking getOrCreateReferralCode...');
    const { data: user, error: userErr } = await db
      .from('User')
      .select('id, referralCode, firstName, lastName, email')
      .eq('id', userId)
      .single();
    console.log('User select:', { user, userErr });

    console.log('2. Checking referrals select...');
    const { data: referrals, error: refErr } = await db
      .from('referrals')
      .select('*, referee:User!refereeId(firstName, lastName, email)')
      .eq('referrerId', userId);
    console.log('Referrals count:', referrals ? referrals.length : 0, 'Error:', refErr);

    console.log('3. Checking ReferralVisit select...');
    const { count: visitsCount, error: visitErr } = await db
      .from('ReferralVisit')
      .select('*', { count: 'exact', head: true })
      .eq('referrerId', userId);
    console.log('Visits count:', visitsCount, 'Error:', visitErr);

  } catch (err) {
    console.error('Fatal error during checks:', err);
  }
}

check();
