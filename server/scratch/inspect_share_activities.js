const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { SupabaseService } = require('../dist/supabase/supabase.service');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService);
  const db = supabase.getClient();

  console.log('Querying AuditLog for action=STAFF_ACTIVITY, entityType=staff_dashboard, entityId=share...');
  const { data, count, error } = await db
    .from('AuditLog')
    .select('id, entityId, changes, createdAt')
    .eq('action', 'STAFF_ACTIVITY')
    .eq('entityType', 'staff_dashboard')
    .eq('entityId', 'share')
    .order('createdAt', { ascending: false })
    .range(0, 14);

  if (error) {
    console.error('Query error:', error);
    await app.close();
    return;
  }

  console.log(`Total count in DB matching 'share' filter: ${count}`);
  console.log('Items returned:');
  data.forEach((row, i) => {
    const changes = row.changes || {};
    console.log(`${i + 1}. Msg: ${changes.msg || changes.message} | type: ${changes.activityType || row.entityId} | CreatedAt: ${row.createdAt}`);
  });

  await app.close();
}

run().catch(console.error);
