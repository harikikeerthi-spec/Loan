const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const userId = 'a3accd49-0632-491b-bdf5-ed425fbe6d33'; // Real userId
    const docType = 'aadhaar_card';
    const id = `${userId}_${docType}_${Date.now()}`;
    
    console.log('Testing insert with ID:', id);
    
    const { data, error } = await supabase
        .from('UserDocument')
        .insert({
            id,
            userId,
            docType,
            uploaded: false,
            status: 'pending',
            updatedAt: new Date().toISOString()
        });
        
    if (error) {
        console.error('Insert Failed! Error:', error);
    } else {
        console.log('Insert Succeeded! Data:', data);
    }
}

testInsert();
