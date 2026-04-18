const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkUsers() {
  console.log('Fetching users from Supabase...');
  const { data, error } = await supabase.from('User').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No users found in table.');
    return;
  }
  
  console.log('Sample User:', JSON.stringify(data[0], null, 2));
  console.log('Columns in User table:', Object.keys(data[0]));
}

checkUsers();
