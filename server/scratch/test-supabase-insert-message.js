const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
try {
  fs.readFileSync('./server/.env', 'utf-8').split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && key.trim()) env[key.trim()] = values.join('=').trim();
  });
} catch (e) {
  try {
    fs.readFileSync('./.env', 'utf-8').split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && key.trim()) env[key.trim()] = values.join('=').trim();
    });
  } catch (err) {}
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function testInsert() {
  const convId = '86ba6d7d-e862-4b0b-81e1-ff9c768476c1';
  console.log('Inserting into conversation:', convId);
  
  const payload = {
    conversationId: convId,
    senderType: 'staff',
    senderId: 'test@test.com',
    content: 'Test file.pdf',
    messageType: 'document',
    status: 'sent',
    attachmentUrl: 'local:some_path.pdf',
    attachmentType: 'application/pdf'
  };
  
  const { data, error } = await supabase.from('Message').insert(payload).select();
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
  }
}

testInsert().catch(console.error);
