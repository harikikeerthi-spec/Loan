const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStaffProfiles() {
    console.log('Testing StaffProfile query...');
    const { data, error } = await supabase
      .from('StaffProfile')
      .select('*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile, phoneNumber, dateOfBirth, role, createdAt)')
      .order('createdAt', { ascending: false });
    
    if (error) {
        console.error('Supabase Query Error:', error);
    } else {
        console.log('Query Succeeded! Profiles count:', data.length);
        if (data.length > 0) {
            console.log('First Profile:', JSON.stringify(data[0], null, 2));
        }
    }
}

testStaffProfiles();
