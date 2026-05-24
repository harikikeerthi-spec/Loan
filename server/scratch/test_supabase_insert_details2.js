const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function testInsertDetails2() {
    console.log('Booting NestJS app context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const supabase = app.get(require('../dist/supabase/supabase.service').SupabaseService);
    const db = supabase.getClient();

    const validUserId = 'e5247513-4211-48ee-a877-a1ea6a2399c5';
    const payload = {
        action: 'STAFF_ACTIVITY',
        entityType: 'DASHBOARD',
        entityId: 'INFO',
        initiatedBy: validUserId,
        changes: { msg: 'test' }
    };

    console.log(`Attempting insert with valid user ID "${validUserId}" and entityId: "INFO"...`);
    const res = await db.from('AuditLog').insert(payload).select();
    if (res.error) {
        console.error('Supabase returned error:', res.error);
    } else {
        console.log('Supabase insert succeeded:', res.data);
    }

    await app.close();
}

testInsertDetails2().catch(console.error);
