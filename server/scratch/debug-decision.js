const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

const appId = '3d7c140f-8dfa-4284-9546-475358dd7ac6';
const bankUser = {
  id: 'VL-STU-2026-00006',
  email: 'hellobro24@gmail.com',
  role: 'bank',
  firstName: 'Hello',
  lastName: 'Bro'
};

async function debug() {
  console.log('Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const { BankService } = require('../dist/bank/bank.service');
  const bankService = app.get(BankService);

  console.log('Updating application status to under_bank_review...');
  const supabaseService = app.get(require('../dist/supabase/supabase.service').SupabaseService);
  await supabaseService.getClient()
    .from('LoanApplication')
    .update({ status: 'under_bank_review', stage: 'Verification' })
    .eq('id', appId);

  console.log('Invoking registerDecision for counter_offer...');
  try {
    const result = await bankService.registerDecision(
      appId,
      'counter_offer',
      {
        offeredAmount: 3000000,
        offeredRate: 9.8,
        offeredTenure: 120,
        remarks: 'Debug counter offer comments'
      },
      bankUser
    );
    console.log('Result:', result);
  } catch (err) {
    console.error('Direct Exception Caught:', err);
  }

  await app.close();
}

debug().catch(console.error);
