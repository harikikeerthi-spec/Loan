const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function testInsertDetails() {
    console.log('Booting NestJS app context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const supabase = app.get(require('../dist/supabase/supabase.service').SupabaseService);
    const db = supabase.getClient();

    const payload = {
        action: 'STAFF_ACTIVITY',
        entityType: 'DASHBOARD',
        entityId: 'INFO',
        initiatedBy: 'system',
        changes: { msg: 'test' }
    };

    console.log('Attempting insert with initiatedBy: "system", entityId: "INFO"...');
    const res = await db.from('AuditLog').insert(payload).select();
    if (res.error) {
        console.error('Supabase returned error:', res.error);
    } else {
        console.log('Supabase insert succeeded:', res.data);
    }

    // Attempt insert with a valid user ID but invalid entityId
    const validUserId = '3f8595bf-d7e7-4008-8e6d-74d398d5c4ff';
    const payload2 = {
        action: 'STAFF_ACTIVITY',
        entityType: 'DASHBOARD',
        entityId: 'INFO',
        initiatedBy: validUserId,
        changes: { msg: 'test' }
    };

    console.log(`\nAttempting insert with initiatedBy: "${validUserId}", entityId: "INFO"...`);
    const res2 = await db.from('AuditLog').insert(payload2).select();
    if (res2.error) {
        console.error('Supabase returned error 2:', res2.error);
    } else {
        console.log('Supabase insert succeeded 2:', res2.data);
    }

    await app.close();
}

testInsertDetails().catch(console.error);
