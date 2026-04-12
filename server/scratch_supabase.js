const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhhmqdbzsmwyizmvwtsx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
    console.log('Testing Supabase REST API Connection...');
    const { data, error } = await supabase.from('User').select('id').limit(1);
    
    if (error) {
        console.error('Supabase Error:', error.message);
        process.exit(1);
    } else {
        console.log('Successfully connected and queried Supabase API!');
        console.log('Data:', data);
        process.exit(0);
    }
}

testSupabase();
