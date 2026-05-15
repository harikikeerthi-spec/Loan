const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseInsert() {
    const { data, error } = await supabase
      .from('User')
      .insert({
        email: 'test_id_issue_supa3@example.com',
        firstName: 'Test',
        lastName: 'Test',
        phoneNumber: '1234567890',
        dateOfBirth: '2000-01-01',
        mobile: '1234567890',
        password: '',
        role: 'user',
      })
      .select()
      .single();

    if (error) {
        console.error('Supabase error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Supabase success:', data);
        await supabase.from('User').delete().eq('id', data.id);
    }
}

testSupabaseInsert();
