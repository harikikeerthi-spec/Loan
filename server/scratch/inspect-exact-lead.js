const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function inspectExact() {
  const { data: application, error: appErr } = await supabase
    .from('LoanApplication')
    .select('*')
    .eq('applicationNumber', 'VL-APP-2026-00048')
    .single();

  if (appErr) {
    console.error('App error:', appErr);
    return;
  }

  const { data: user, error: userErr } = await supabase
    .from('User')
    .select('*')
    .eq('id', application.userId)
    .single();

  const { data: referral, error: refErr } = await supabase
    .from('Referral')
    .select('*')
    .eq('refereeId', application.userId)
    .maybeSingle();

  console.log('--- APPLICATION DATA ---');
  console.log(JSON.stringify(application, null, 2));
  console.log('\n--- REFEREE USER DATA ---');
  console.log(JSON.stringify(user, null, 2));
  console.log('\n--- REFERRAL DATA ---');
  console.log(JSON.stringify(referral, null, 2));
}

inspectExact().catch(console.error);
