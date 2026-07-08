const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './server/.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function inspectLastLeads() {
  console.log('Inspecting last 5 LoanApplications and their Referrals:');
  const { data: apps, error: appErr } = await supabase
    .from('LoanApplication')
    .select('id, applicationNumber, userId, email, firstName, lastName, submittedAt')
    .order('applicationNumber', { ascending: false })
    .limit(5);

  if (appErr) {
    console.error('Error fetching applications:', appErr);
    return;
  }

  for (const app of apps) {
    console.log(`\nApplication: ${app.applicationNumber} (${app.firstName} ${app.lastName}, email: ${app.email}, userId: ${app.userId})`);
    
    // Fetch referral if any
    const { data: referral, error: refErr } = await supabase
      .from('Referral')
      .select('*')
      .eq('refereeId', app.userId)
      .maybeSingle();

    if (refErr) {
      console.error(`  Error fetching referral for refereeId ${app.userId}:`, refErr);
    } else if (referral) {
      console.log(`  Referral: id=${referral.id}, referrerId=${referral.referrerId}, refereeEmail=${referral.refereeEmail}, status=${referral.status}`);
    } else {
      console.log(`  No referral found for refereeId ${app.userId}`);
    }
  }
}

inspectLastLeads().catch(console.error);
