const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || 'secretKey';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function runTests() {
    try {
        console.log('--- Verifying Conditions Persistence & File Detail Integration ---');
        
        // 1. Fetch a valid application
        console.log('Fetching a valid LoanApplication from database...');
        const { data: apps, error: appErr } = await supabase
            .from('LoanApplication')
            .select('id, amount, status')
            .limit(1);

        if (appErr || !apps || apps.length === 0) {
            throw new Error(`Failed to find a valid application: ${appErr?.message}`);
        }
        const testApp = apps[0];
        console.log(`Found test application: ID=${testApp.id}, Amount=${testApp.amount}, Status=${testApp.status}`);

        // 2. Fetch a bank user to authenticate the request
        console.log('Fetching a valid bank user for authentication...');
        const { data: users, error: userErr } = await supabase
            .from('User')
            .select('id, email, role')
            .eq('role', 'bank')
            .limit(1);

        if (userErr || !users || users.length === 0) {
            throw new Error(`Failed to find a bank user: ${userErr?.message}`);
        }
        const testUser = users[0];
        console.log(`Found test bank user: ID=${testUser.id}, Email=${testUser.email}, Role=${testUser.role}`);

        const authPayload = {
            email: testUser.email,
            sub: testUser.id,
            firstName: 'TestBanker',
            lastName: 'User',
            role: testUser.role
        };
        const token = jwt.sign(authPayload, secret);

        // Define target mock conditions to save
        const mockConditions = [
            { id: 'cond-test-1', text: 'Submit parent KYC documents', type: 'mandatory', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'cond-test-2', text: 'Provide updated bank statement for 6 months', type: 'advisory', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() }
        ];

        // 3. Post to the saveConditionalSanctions endpoint
        const saveUrl = `http://localhost:${port}/api/bank/conditional-sanctions/${testApp.id}`;
        console.log(`POST ${saveUrl} ...`);
        const saveRes = await fetch(saveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                conditions: mockConditions,
                deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
            })
        });

        if (!saveRes.ok) {
            const errText = await saveRes.text();
            throw new Error(`POST save-conditions failed with status ${saveRes.status}: ${errText}`);
        }
        const saveData = await saveRes.json();
        console.log('✅ Save conditions response:', saveData);

        // 4. Retrieve application details and verify relations
        const detailUrl = `http://localhost:${port}/api/bank/applications/${testApp.id}/detail`;
        console.log(`GET ${detailUrl} ...`);
        const detailRes = await fetch(detailUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!detailRes.ok) {
            throw new Error(`GET details failed with status ${detailRes.status}`);
        }
        const detailData = await detailRes.json();
        console.log('Detail data keys:', Object.keys(detailData));
        console.log('Detail data conditional_sanctions field:', detailData.conditional_sanctions);
        
        // Check if conditional_sanctions exists in application detail
        if (!detailData.conditional_sanctions) {
            throw new Error('❌ Error: conditional_sanctions field is missing from getFileDetail response!');
        }

        console.log(`Found ${detailData.conditional_sanctions.length} conditional sanction records linked.`);
        const latestSanction = detailData.conditional_sanctions[0];
        if (!latestSanction) {
            throw new Error('❌ Error: No conditional sanction records found in detail response.');
        }

        console.log('Latest conditional sanction:', latestSanction);
        const savedList = latestSanction.conditionsList;
        if (!Array.isArray(savedList) || savedList.length !== 2) {
            throw new Error(`❌ Error: Expected 2 conditions, but got: ${JSON.stringify(savedList)}`);
        }

        if (savedList[0].id !== 'cond-test-1' || savedList[1].id !== 'cond-test-2') {
            throw new Error('❌ Error: Saved conditions ids do not match!');
        }

        console.log('✅ Success: Saved conditions list matches the fetched list perfectly!');

        // 5. Query Supabase directly to verify database entry
        console.log('Querying Supabase directly for conditional_sanctions entry...');
        const { data: dbData, error: dbErr } = await supabase
            .from('conditional_sanctions')
            .select('*')
            .eq('applicationId', testApp.id);

        if (dbErr) {
            throw new Error(`Supabase query failed: ${dbErr.message}`);
        }
        console.log(`Found ${dbData.length} records in conditional_sanctions table.`);
        
        // 6. Cleanup
        console.log('Cleaning up created conditional_sanctions rows...');
        const { error: deleteErr } = await supabase
            .from('conditional_sanctions')
            .delete()
            .eq('applicationId', testApp.id);

        if (deleteErr) {
            console.warn(`⚠️ Warning: Failed to clean up database row: ${deleteErr.message}`);
        } else {
            console.log('✅ Cleanup completed successfully.');
        }

        console.log('\n🎉 PERSISTENCE INTEGRATION VERIFICATION PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('\n❌ Verification failed:', err.message || err);
        process.exit(1);
    }
}

runTests();
