const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function run() {
  console.log('Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const { BankService } = require('../dist/bank/bank.service');
  const bankService = app.get(BankService);
  const supabaseService = app.get(require('../dist/supabase/supabase.service').SupabaseService);
  const db = supabaseService.getClient();

  // Find a LoanApplication in the DB to test with
  const { data: apps, error: fetchErr } = await db
    .from('LoanApplication')
    .select('*')
    .limit(10);

  if (fetchErr) {
    console.error('Error fetching loan applications:', fetchErr);
    await app.close();
    return;
  }

  if (!apps || apps.length === 0) {
    console.error('No loan applications found in the database.');
    await app.close();
    return;
  }

  console.log(`Found ${apps.length} applications.`);
  for (const a of apps) {
    console.log(`- ID: ${a.id}, Status: ${a.status}, Bank: ${a.bank}, LAN: ${a.applicationNumber}`);
  }

  // Find one with 'submitted_to_bank' or similar
  const testApp = apps.find(a => a.status === 'submitted_to_bank') || apps[0];
  console.log(`Testing decision registration on App ID: ${testApp.id} (Status: ${testApp.status})`);

  const bankUser = {
    id: 'some-bank-user-id',
    email: 'banker@example.com',
    role: 'bank',
    firstName: 'Jean',
    lastName: 'G'
  };

  try {
    const result = await bankService.registerDecision(
      testApp.id,
      'sanction',
      {
        sanctionAmount: 5000000,
        interestRate: 9.5,
        roiType: 'floating',
        tenure: 120,
        remarks: 'Test sanction decision'
      },
      bankUser
    );
    console.log('Success registerDecision result:', result);
  } catch (err) {
    console.error('registerDecision failed with error:', err);
    if (err.response) {
      console.error('Error response details:', err.response);
    }
  }

  await app.close();
}

run().catch(console.error);
