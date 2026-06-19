const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('./server/.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function test() {
  const notifData = {
    id: 'notif-test-' + Date.now(),
    userId: 'staff',
    title: 'Test Title',
    body: 'Test Body',
    type: 'query_raised',
    isRead: false,
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  const { data, error } = await supabase
    .from('Notification')
    .insert(notifData);
  
  console.log('Result Data:', data);
  console.log('Result Error:', error);
}

test();
