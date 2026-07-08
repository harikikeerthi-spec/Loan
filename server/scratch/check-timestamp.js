const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function checkTimestamp() {
  const { data, error } = await supabase
    .from('LoanApplication')
    .select('applicationNumber, submittedAt, date, updatedAt')
    .eq('applicationNumber', 'VL-APP-2026-00048')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log('Application:', data);
  }
}

checkTimestamp().catch(console.error);
