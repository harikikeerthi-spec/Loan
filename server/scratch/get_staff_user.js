const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
try {
  fs.readFileSync('./server/.env', 'utf-8').split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && key.trim()) env[key.trim()] = values.join('=').trim();
  });
} catch (e) {
  try {
    fs.readFileSync('./.env', 'utf-8').split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && key.trim()) env[key.trim()] = values.join('=').trim();
    });
  } catch (err) {}
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data: users, error } = await supabase
    .from('User')
    .select('*')
    .ilike('firstName', '%Jean%');
  console.log(users);
}
run().catch(console.error);
