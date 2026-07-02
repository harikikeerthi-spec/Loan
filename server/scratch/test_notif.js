const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  console.log("Querying all notifications...");
  const { data: notifications, error } = await supabase.from('Notification').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Fetched ${notifications.length} notifications:`);
    notifications.forEach((n, idx) => {
      console.log(`[${idx}]`, JSON.stringify(n, null, 2));
    });
  }
}

run();
