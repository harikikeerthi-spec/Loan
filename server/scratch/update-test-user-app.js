const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('./.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) {
    let val = values.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key.trim()] = val;
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function run() {
  console.log('Updating existing application and user...');
  
  // 1. Update LoanApplication
  const { data: appData, error: appError } = await supabase
    .from('LoanApplication')
    .update({ country: 'UK' })
    .eq('applicationNumber', 'VL-APP-2026-00031')
    .select();
    
  if (appError) {
    console.error('Error updating application:', appError);
  } else {
    console.log('Application updated successfully:', appData);
  }
  
  // 2. Update User
  const { data: userData, error: userError } = await supabase
    .from('User')
    .update({ studyDestination: 'UK', intakeSeason: 'Fall 2026' })
    .eq('id', 'VL-STU-2026-00014')
    .select();
    
  if (userError) {
    console.error('Error updating user:', userError);
  } else {
    console.log('User updated successfully:', userData);
  }
}

run();
