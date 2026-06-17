const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Inspecting BankDecision structure...');
        const { data: decData, error: decErr } = await supabase
            .from('BankDecision')
            .select('*')
            .limit(1);
        if (decErr) console.error('BankDecision error:', decErr);
        else console.log('BankDecision sample:', decData);

        console.log('Inspecting conditional_sanctions structure...');
        const { data: condData, error: condErr } = await supabase
            .from('conditional_sanctions')
            .select('*')
            .limit(1);
        if (condErr) console.error('conditional_sanctions error:', condErr);
        else console.log('conditional_sanctions sample:', condData);

    } catch (e) {
        console.error(e);
    }
}
run();
