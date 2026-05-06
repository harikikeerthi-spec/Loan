const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing getAllApplications query...');
    const { data, error, count } = await supabase
        .from('LoanApplication')
        .select('*, user:User!userId(id, email, firstName, lastName), documents:ApplicationDocument(id, status)', { count: 'exact' })
        .order('date', { ascending: false })
        .limit(20);
    
    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Query Success. Count:', count);
        console.log('First application:', data[0] ? data[0].applicationNumber : 'None');
    }
}

testQuery();
