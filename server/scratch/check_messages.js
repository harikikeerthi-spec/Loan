require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://mhhmqdbzsmwyizmvwtsx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('Message').select('*').order('createdAt', { ascending: false }).limit(10);
  if (error) {
    console.error('Error fetching messages:', error);
  } else {
    console.log('Latest 10 messages:');
    console.log(JSON.stringify(data, null, 2));
  }
}
check();
