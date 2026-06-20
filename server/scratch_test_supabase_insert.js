const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseInsert() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing env vars');
        return;
    }
    
    const db = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
    });
    
    console.log('Inserting message using Supabase Client...');
    const { data: message, error } = await db
      .from('Message')
      .insert({
        conversationId: 'ad1097dd-ab70-42f1-a879-1cacbef1fa01',
        senderType: 'staff',
        senderId: 'staff@example.com',
        receiverType: 'customer',
        content: 'Test Supabase client insertion',
        messageType: 'text',
        status: 'sent'
      })
      .select()
      .single();

    if (error) {
        console.error('Failed to save message in Supabase:', error);
    } else {
        console.log('Success saving message in Supabase:', message);
    }
}
testSupabaseInsert();
