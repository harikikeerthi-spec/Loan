const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Testing manual query for conditional_sanctions...');
        const { data: application, error: appErr } = await supabase
            .from('LoanApplication')
            .select('*, BankDecision(*)')
            .limit(1)
            .single();

        if (appErr) {
            throw new Error(`App fetch failed: ${appErr.message}`);
        }

        console.log(`Fetched App: ${application.id}`);

        const { data: condSanctions, error: condErr } = await supabase
            .from('conditional_sanctions')
            .select('*')
            .eq('applicationId', application.id)
            .order('createdAt', { ascending: false });

        if (condErr) {
            throw new Error(`Cond fetch failed: ${condErr.message}`);
        }

        application.conditional_sanctions = condSanctions || [];
        console.log('✅ Manual select succeeded! Attached conditional_sanctions:', application.conditional_sanctions);
    } catch (e) {
        console.error('❌ Failed:', e.message);
    }
}
run();
