const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './server/.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function checkUsers() {
  console.log('\n📋 Checking latest registered users...\n');
  
  const { data, error } = await supabase
    .from('User')
    .select('id, email, firstName, lastName, role, createdAt')
    .order('createdAt', { ascending: false })
    .limit(15);
  
  if (error) {
    console.log('❌ ERROR:', error);
  } else {
    console.log('Last 15 registered users:');
    console.log('─'.repeat(90));
    console.log('User ID              | Email                      | Name                  | Role');
    console.log('─'.repeat(90));
    data.forEach(user => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
      console.log(`${user.id.padEnd(20)} | ${(user.email || 'N/A').padEnd(26)} | ${name.padEnd(21)} | ${user.role || 'user'}`);
    });
    console.log('─'.repeat(90));
    
    const { count } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nTotal users in database: ${count}\n`);
  }
}

checkUsers();
