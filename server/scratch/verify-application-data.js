const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('./server/.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data: apps, error } = await supabase
    .from('LoanApplication')
    .select('*')
    .eq('applicationNumber', 'VL-APP-2026-00017');
  
  if (error) {
    console.error('Error fetching applications:', error);
    return;
  }
  console.log('VL-APP-2026-00017:', apps[0]);
}

run();
