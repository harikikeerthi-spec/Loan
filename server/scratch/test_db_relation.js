const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing BankQuery join QueryResponse...');
  const { data, error } = await supabase
    .from('BankQuery')
    .select('*, responses:QueryResponse(*)')
    .limit(1);

  if (error) {
    console.error('FAIL:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

run();
