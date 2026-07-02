const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  console.log("Querying bank users...");
  const { data: users, error } = await supabase.from('User').select('*').eq('role', 'bank');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Fetched ${users.length} bank users:`);
    users.forEach((u, idx) => {
      console.log(`[${idx}]`, JSON.stringify(u, null, 2));
    });
  }
}

run();
