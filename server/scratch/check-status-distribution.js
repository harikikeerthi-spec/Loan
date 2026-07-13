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

async function run() {
  const { data: users, error } = await supabase
    .from('User')
    .select('*')
    .eq('role', 'user')
    .limit(3);
    
  if (error) console.error(error);
  else {
    users.forEach(user => {
      console.log('User ID:', user.id);
      console.log('  family:', typeof user.family === 'string' ? JSON.parse(user.family) : user.family);
      console.log('  coApplicant:', typeof user.coApplicant === 'string' ? JSON.parse(user.coApplicant) : user.coApplicant);
      console.log('  fatherName:', user.fatherName);
      console.log('  motherName:', user.motherName);
      console.log('  coApplicantName:', user.coApplicantName);
      console.log('-------------------------------');
    });
  }
}

run();
