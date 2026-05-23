const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const client = createClient(supabaseUrl, supabaseKey);

    const targetAppId = 'e222115c-a960-4831-936b-c7488a9f76fe';

    const { data, error } = await client
        .from('Disbursement')
        .select('*')
        .eq('applicationId', targetAppId);

    console.log('Query result:', data);
    console.log('Query error:', error);
}

main().catch(console.error);
