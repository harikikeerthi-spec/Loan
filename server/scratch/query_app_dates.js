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

async function checkApp() {
  const { data, error } = await supabase
    .from('LoanApplication')
    .select('*')
    .eq('applicationNumber', 'VL-APP-2026-00006')
    .single();
  
  if (error) {
    console.error('Error fetching application:', error);
  } else {
    console.log('Application:', JSON.stringify(data, null, 2));
    
    // Also query the user/student details
    if (data.userId) {
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', data.userId)
        .single();
      if (userError) {
        console.error('Error fetching user:', userError);
      } else {
        console.log('User:', JSON.stringify(userData, null, 2));
      }
    }
  }
}

checkApp();
