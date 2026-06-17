const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Testing LoanApplication with relation select...');
        const { data, error } = await supabase
            .from('LoanApplication')
            .select('*, BankDecision(*), conditional_sanctions(*)')
            .limit(1);

        if (error) {
            console.error('❌ Query failed:', error);
        } else {
            console.log('✅ Query succeeded! Returned:', data);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
