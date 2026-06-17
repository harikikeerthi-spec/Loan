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
        console.log('--- Verifying Notification Deletion upon View ---');
        
        // 1. Fetch a valid user to use their ID for the foreign key
        console.log('Fetching a valid user from database...');
        const { data: users, error: userErr } = await supabase
            .from('User')
            .select('id, email, role')
            .limit(1);

        if (userErr || !users || users.length === 0) {
            throw new Error(`Failed to find a valid user: ${userErr?.message}`);
        }
        const testUser = users[0];
        console.log(`Found test user: ID=${testUser.id}, Email=${testUser.email}, Role=${testUser.role}`);

        // Generate JWT token for this user
        const payload = {
            email: testUser.email,
            sub: testUser.id,
            firstName: 'Test',
            lastName: 'User',
            role: testUser.role
        };
        const token = jwt.sign(payload, secret);

        const dummyId = 'notif-test-' + Date.now();
        console.log(`Creating test notification ${dummyId} in database for user ${testUser.id}...`);
        const { error: insertErr } = await supabase
            .from('Notification')
            .insert({
                id: dummyId,
                userId: testUser.id,
                title: '⚡ Test notification',
                body: 'This is a test notification for deletion.',
                type: 'candidate_registered',
                isRead: false,
                timestamp: new Date().toISOString()
            });

        if (insertErr) {
            throw new Error(`Failed to insert notification: ${insertErr.message}`);
        }
        console.log('Test notification inserted successfully.');

        // 2. Fetch notifications via HTTP API and verify it exists
        const notificationsUrl = `http://localhost:${port}/api/notifications`;
        console.log(`GET ${notificationsUrl} ...`);
        const getRes = await fetch(notificationsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!getRes.ok) {
            throw new Error(`GET notifications failed with status ${getRes.status}`);
        }
        const getData = await getRes.json();
        console.log(`Fetched ${getData.items?.length || 0} notifications.`);
        const found = getData.items?.find(n => n.id === dummyId);
        if (!found) {
            throw new Error(`Test notification was not returned in list!`);
        }
        console.log('✅ Success: Test notification is returned in GET response.');

        // 3. Mark notification as read (which should delete it in the backend)
        const markUrl = `http://localhost:${port}/api/notifications/${dummyId}/mark-read`;
        console.log(`PUT ${markUrl} ...`);
        const putRes = await fetch(markUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!putRes.ok) {
            throw new Error(`PUT mark-read failed with status ${putRes.status}`);
        }
        const putData = await putRes.json();
        console.log('Marked read response:', putData);

        // 4. Fetch notifications again to verify it has disappeared
        console.log(`GET ${notificationsUrl} ...`);
        const getRes2 = await fetch(notificationsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!getRes2.ok) {
            throw new Error(`GET notifications (second) failed with status ${getRes2.status}`);
        }
        const getData2 = await getRes2.json();
        const foundAfter = getData2.items?.find(n => n.id === dummyId);
        if (foundAfter) {
            throw new Error('❌ Test notification is still returned in list after being viewed!');
        }
        console.log('✅ Success: Test notification has disappeared from the fetched list.');

        // 5. Verify database row is deleted
        console.log('Verifying notification deletion in database...');
        const { data: dbData, error: dbErr } = await supabase
            .from('Notification')
            .select('id')
            .eq('id', dummyId)
            .maybeSingle();

        if (dbErr) {
            throw new Error(`Failed to query database: ${dbErr.message}`);
        }
        if (dbData) {
            throw new Error('❌ Database row was not deleted! It was only marked as read.');
        }
        console.log('✅ Success: Test notification row was physically deleted from the database!');
        console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('\n❌ Verification failed:', err.message || err);
        process.exit(1);
    }
}

runTests();
