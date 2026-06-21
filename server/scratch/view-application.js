const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function run() {
  console.log('Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const supabaseService = app.get(require('../dist/supabase/supabase.service').SupabaseService);
  const db = supabaseService.getClient();

  const appId = '72db29f2-3331-47f8-8a58-026a6aff1a77';
  const { data: application, error } = await db
    .from('LoanApplication')
    .select('*')
    .eq('id', appId)
    .single();

  if (error) {
    console.error('Error fetching application:', error);
  } else {
    console.log('Application details:', {
      id: application.id,
      status: application.status,
      applicationNumber: application.applicationNumber,
      lanNumber: application.lanNumber,
      amount: application.amount,
      bank: application.bank,
      stage: application.stage,
      progress: application.progress
    });
  }

  await app.close();
}

run().catch(console.error);
