const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function checkHistory() {
  const { data: appData } = await supabase
    .from('LoanApplication')
    .select('id')
    .eq('applicationNumber', 'VL-APP-2026-00006')
    .single();

  if (!appData) {
    console.log('App not found');
    return;
  }

  const { data, error } = await supabase
    .from('ApplicationStatusHistory')
    .select('*')
    .eq('applicationId', appData.id);
  
  if (error) {
    console.error('Error fetching status history:', error);
  } else {
    console.log('Status History:', JSON.stringify(data, null, 2));
  }
}

checkHistory();
