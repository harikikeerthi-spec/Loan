const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const newNotif = {
    id: 'notif-test-' + Date.now(),
    userId: 'bank',
    title: 'Test Bank Notification',
    body: 'This is a test notification for bank',
    type: 'bank_application_received',
    isRead: false,
    timestamp: new Date().toISOString(),
    metadata: { test: true },
  };

  const { data, error } = await supabase
    .from('Notification')
    .insert(newNotif)
    .select()
    .single();

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Successful:", data);
  }
}

run();
