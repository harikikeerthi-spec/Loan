const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error, count } = await supabase
    .from('Notification')
    .select('*', { count: 'exact' });

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Total notifications:", count);
    console.log("Last 20 notifications:");
    console.log(JSON.stringify(data.slice(-20), null, 2));
  }
}

run();
