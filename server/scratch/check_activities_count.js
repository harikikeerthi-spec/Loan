const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { SupabaseService } = require('../dist/supabase/supabase.service');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService);
  const db = supabase.getClient();

  const filters = ['all', 'new', 'update', 'upload', 'share', 'approved', 'rejected'];

  for (const filter of filters) {
    let query = db
      .from('AuditLog')
      .select('id, entityId, changes, createdAt', { count: 'exact' })
      .eq('action', 'STAFF_ACTIVITY')
      .eq('entityType', 'staff_dashboard')
      .order('createdAt', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('entityId', filter);
    }

    // Emulate pagination
    query = query.range(0, 14);

    const { data, count, error } = await query;
    if (error) {
      console.error(`Error for filter ${filter}:`, error);
    } else {
      console.log(`Filter: ${filter.toUpperCase().padEnd(12)} | Data count (page 1): ${data.length} | Exact Count: ${count}`);
    }
  }

  await app.close();
}

run().catch(console.error);
