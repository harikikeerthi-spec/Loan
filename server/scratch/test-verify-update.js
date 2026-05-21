const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Let's get one document ID first
    const { data: docs } = await supabase
        .from('ApplicationDocument')
        .select('id, docType, status, verifiedBy, applicationId')
        .limit(1);

    if (!docs || docs.length === 0) {
        console.log('No documents found to test.');
        return;
    }

    const docId = docs[0].id;
    console.log(`Testing update on document ID: ${docId}`);

    // Try updating verifiedBy to the bank user's ID
    const bankUserId = '6f58145c-53c4-438d-b892-10f3c45a5582'; // from query-db-state
    console.log(`Attempting update with verifiedBy = ${bankUserId} (bank role User)...`);
    
    const { data: updated, error } = await supabase
        .from('ApplicationDocument')
        .update({
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            verifiedBy: bankUserId,
            rejectionReason: null
        })
        .eq('id', docId)
        .select();

    if (error) {
        console.error('Update failed with error:', error);
    } else {
        console.log('Update succeeded! Response:', updated);
    }
}

main();
