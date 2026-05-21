const { NestFactory } = require('@nestjs/core');
const { Client } = require('pg');
require('dotenv').config();

async function runVerification() {
    console.log('🚀 Starting end-to-end service validation for shareProfile...');
    
    // 1. Fetch a real student user from the database
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    const userRes = await client.query('SELECT id, email, "firstName", "lastName" FROM "User" WHERE role = \'user\' LIMIT 1');
    if (userRes.rows.length === 0) {
        console.error('❌ No student users found to test with.');
        await client.end();
        return;
    }
    const student = userRes.rows[0];
    console.log(`👤 Found student for testing: ${student.firstName} ${student.lastName} (${student.email}), ID: ${student.id}`);
    
    // We will clean up any existing records for this student to start fresh
    console.log('🧹 Cleaning up any old test records for this student...');
    
    // Fetch staff profile first to delete documents and shares
    const spRes = await client.query('SELECT id FROM "StaffProfile" WHERE "linkedUserId" = $1', [student.id]);
    if (spRes.rows.length > 0) {
        const spId = spRes.rows[0].id;
        await client.query('DELETE FROM "StaffProfileShare" WHERE "staffProfileId" = $1', [spId]);
        await client.query('DELETE FROM "StaffProfileDocument" WHERE "staffProfileId" = $1', [spId]);
        await client.query('DELETE FROM "StaffProfile" WHERE id = $1', [spId]);
    }
    
    // Fetch loan applications to delete history, notes, and the application
    const laRes = await client.query('SELECT id FROM "LoanApplication" WHERE "userId" = $1', [student.id]);
    if (laRes.rows.length > 0) {
        const appIds = laRes.rows.map(r => r.id);
        await client.query('DELETE FROM "ApplicationStatusHistory" WHERE "applicationId" = ANY($1)', [appIds]);
        await client.query('DELETE FROM "ApplicationNote" WHERE "applicationId" = ANY($1)', [appIds]);
        await client.query('DELETE FROM "LoanApplication" WHERE id = ANY($1)', [appIds]);
    }
    
    console.log('🧹 Cleanup complete. Bootstrapping NestJS...');
    
    // 2. Bootstrap NestJS
    const { AppModule } = require('../dist/app.module');
    const { StaffProfileService } = require('../dist/staff-profile/staff-profile.service');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(StaffProfileService);
    
    const staffRes = await client.query('SELECT id, email, "firstName", "lastName" FROM "User" WHERE role = \'staff\' LIMIT 1');
    if (staffRes.rows.length === 0) {
        console.error('❌ No staff users found in database.');
        await client.end();
        await app.close();
        return;
    }
    const mockStaff = staffRes.rows[0];
    console.log(`👤 Found staff for testing: ${mockStaff.firstName} ${mockStaff.lastName} (${mockStaff.email}), ID: ${mockStaff.id}`);

    
    const shareBody = {
        recipientType: 'BANK',
        recipientName: 'HDFC Credila',
        recipientEmail: 'siddukushi@gmail.com',
        message: 'Please review this complete profile for educational loan sanction.',
        sharedBy: 'staff'
    };
    
    console.log('⚡ Calling shareProfile service method...');
    const result = await service.shareProfile(student.id, mockStaff, shareBody);
    console.log('✅ Service method succeeded! Result:', result);
    
    // 3. Database assertions
    console.log('\n🔍 Verifying database insertions...');
    
    // Assert StaffProfile
    const profileDb = await client.query('SELECT * FROM "StaffProfile" WHERE "linkedUserId" = $1', [student.id]);
    console.log('🔹 StaffProfile created:', profileDb.rows.length === 1 ? 'YES' : 'NO');
    if (profileDb.rows.length === 1) {
        console.log(`   - bankStatus: ${profileDb.rows[0].bankStatus} (Expected: SENT)`);
        console.log(`   - targetBank: ${profileDb.rows[0].targetBank} (Expected: HDFC Credila)`);
    }
    
    // Assert StaffProfileShare
    const shareDb = await client.query('SELECT * FROM "StaffProfileShare" WHERE id = $1', [result.shareId]);
    console.log('🔹 StaffProfileShare created:', shareDb.rows.length === 1 ? 'YES' : 'NO');
    
    // Assert LoanApplication
    const appDb = await client.query('SELECT * FROM "LoanApplication" WHERE "userId" = $1', [student.id]);
    console.log('🔹 LoanApplication created:', appDb.rows.length === 1 ? 'YES' : 'NO');
    if (appDb.rows.length === 1) {
        console.log(`   - status: ${appDb.rows[0].status} (Expected: submitted_to_bank)`);
        console.log(`   - stage: ${appDb.rows[0].stage} (Expected: Submitted)`);
        console.log(`   - progress: ${appDb.rows[0].progress} (Expected: 50)`);
        console.log(`   - bank: ${appDb.rows[0].bank} (Expected: HDFC Credila)`);
    }
    
    // Assert ApplicationStatusHistory
    const histDb = await client.query(
        'SELECT "fromStatus", "toStatus", "changeReason" FROM "ApplicationStatusHistory" WHERE "applicationId" = $1 ORDER BY "createdAt" ASC',
        [appDb.rows[0].id]
    );
    console.log(`🔹 ApplicationStatusHistory entries created: ${histDb.rows.length}`);
    histDb.rows.forEach((h, idx) => {
        console.log(`   [Step ${idx + 1}] Transition: ${h.fromStatus || 'NULL'} -> ${h.toStatus} (${h.changeReason})`);
    });
    
    // Assert ApplicationNote
    const notesDb = await client.query(
        'SELECT content, type FROM "ApplicationNote" WHERE "applicationId" = $1',
        [appDb.rows[0].id]
    );
    console.log(`🔹 ApplicationNote entries created: ${notesDb.rows.length}`);
    notesDb.rows.forEach((n, idx) => {
        console.log(`   Note [${idx + 1}] (${n.type}): "${n.content.substring(0, 80)}..."`);
    });
    
    // Assert Notification
    const notifDb = await client.query(
        'SELECT title, body, "userId" FROM "Notification" ORDER BY timestamp DESC LIMIT 1'
    );
    console.log('🔹 Notification generated:', notifDb.rows.length > 0 ? 'YES' : 'NO');
    if (notifDb.rows.length > 0) {
        console.log(`   - Recipient userId: ${notifDb.rows[0].userId}`);
        console.log(`   - Title: ${notifDb.rows[0].title}`);
        console.log(`   - Body: ${notifDb.rows[0].body}`);
    }
    
    // 4. Cleanup
    console.log('\n🧹 Cleaning up test database records...');
    if (profileDb.rows.length > 0) {
        const spId = profileDb.rows[0].id;
        await client.query('DELETE FROM "StaffProfileShare" WHERE "staffProfileId" = $1', [spId]);
        await client.query('DELETE FROM "StaffProfileDocument" WHERE "staffProfileId" = $1', [spId]);
        await client.query('DELETE FROM "StaffProfile" WHERE id = $1', [spId]);
    }
    if (appDb.rows.length > 0) {
        await client.query('DELETE FROM "ApplicationStatusHistory" WHERE "applicationId" = $1', [appDb.rows[0].id]);
        await client.query('DELETE FROM "ApplicationNote" WHERE "applicationId" = $1', [appDb.rows[0].id]);
        await client.query('DELETE FROM "LoanApplication" WHERE id = $1', [appDb.rows[0].id]);
    }
    
    console.log('✅ Clean up complete.');
    
    await client.end();
    await app.close();
    console.log('🎉 Verification run complete!');
}

runVerification().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
