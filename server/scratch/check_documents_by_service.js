const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BankService } = require('../dist/bank/bank.service');
const { SupabaseService } = require('../dist/supabase/supabase.service');

async function run() {
  console.log('Bootstrapping NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const bankService = app.get(BankService);
  const supabase = app.get(SupabaseService);
  const db = supabase.getClient();

  console.log('Finding Abhi Ram applications in DB...');
  const { data: apps } = await db
    .from('LoanApplication')
    .select('id, firstName, lastName, userId, applicationNumber')
    .ilike('firstName', '%Abhi%');

  console.log('Found applications:', apps);

  for (const a of apps) {
    console.log(`\n=== Documents for App: ${a.applicationNumber} (ID: ${a.id}, User: ${a.userId}) ===`);
    const docs = await bankService.getDocuments(a.id);
    console.log(`Total documents returned by getDocuments: ${docs.length}`);
    
    const uploaded = docs.filter(d => d.filePath && d.status !== 'not_uploaded');
    console.log(`Uploaded documents count: ${uploaded.length}`);
    uploaded.forEach(d => {
      console.log(`- Type: ${d.docType}, Path: ${d.filePath}, Status: ${d.status}`);
    });
  }

  await app.close();
}

run().catch(console.error);
