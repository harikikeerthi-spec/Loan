const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
    console.log('=== APPLICATION DOCUMENTS ===');
    const { data: appDocs, error: appError } = await supabase
        .from('ApplicationDocument')
        .select('*');
    if (appError) console.error(appError);
    else console.log(appDocs.map(d => ({ id: d.id, docType: d.docType, status: d.status, app: d.applicationId })));

    console.log('\n=== USER DOCUMENTS ===');
    const { data: userDocs, error: userError } = await supabase
        .from('UserDocument')
        .select('*');
    if (userError) console.error(userError);
    else console.log(userDocs.map(d => ({ id: d.id, docType: d.docType, status: d.status, user: d.userId })));
}

main();
