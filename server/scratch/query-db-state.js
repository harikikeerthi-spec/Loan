const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- USERS ---');
    const { data: users, error: uError } = await supabase
        .from('User')
        .select('id, email, role, firstName, lastName')
        .limit(10);
    
    if (uError) {
        console.error('Error fetching users:', uError);
    } else {
        console.log(users);
    }

    console.log('\n--- APPLICATION DOCUMENTS ---');
    const { data: docs, error: dError } = await supabase
        .from('ApplicationDocument')
        .select('id, docType, status, verifiedBy, applicationId')
        .limit(10);

    if (dError) {
        console.error('Error fetching docs:', dError);
    } else {
        console.log(docs);
    }
}

main();
