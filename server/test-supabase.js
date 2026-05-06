const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Querying User table...');
    const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Error querying Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase. User count:', data);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

test();
