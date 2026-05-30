const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './server/.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function checkApps() {
  console.log('\n📋 Checking latest applications...\n');
  
  const { data, error } = await supabase
    .from('LoanApplication')
    .select('id, applicationNumber, firstName, lastName, submittedAt, updatedAt')
    .order('applicationNumber', { ascending: false })
    .limit(10);
  
  if (error) {
    console.log('❌ ERROR:', error);
  } else {
    console.log('Last 10 applications:');
    console.log('─'.repeat(70));
    data.forEach(app => {
      const dateStr = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Not submitted';
      console.log(`${app.applicationNumber} | ${(app.firstName + ' ' + app.lastName).padEnd(30)} | ${dateStr}`);
    });
    console.log('─'.repeat(70));
    console.log(`\n✅ Total count check...`);
    
    const { count } = await supabase
      .from('LoanApplication')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total applications in database: ${count}\n`);
  }
}

checkApps();
