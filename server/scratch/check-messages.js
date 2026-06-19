const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('./server/.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const appId = '3d7c140f-8dfa-4284-9546-475358dd7ac6';

async function check() {
  // Let's find conversation
  const { data: convs, error: convErr } = await supabase
    .from('Conversation')
    .select('*')
    .eq('customerPhone', `BNK_HDFC_CREDILA_APP_${appId}`);
  
  console.log('--- Conversation ---');
  console.log(convs);

  if (convs && convs.length > 0) {
    const { data: messages, error: msgErr } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', convs[0].id)
      .order('createdAt', { ascending: false });
    
    console.log('\n--- Messages in conversation ---');
    console.log(messages);
  }

  const { data: notifs, error: notifErr } = await supabase
    .from('Notification')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10);
  
  console.log('\n--- Notifications for staff ---');
  console.log(notifs);
}

check();
