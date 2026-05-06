const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkStaff() {
  const { data, error } = await supabase.from('User').select('*').eq('role', 'staff');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} staff users.`);
  if (data.length > 0) {
    console.log('Sample Staff:', data[0].email);
  }
}

checkStaff();
