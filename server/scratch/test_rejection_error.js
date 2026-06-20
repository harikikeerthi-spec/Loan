const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

const appId = '7a1f14df-f3d8-4346-92fe-3b67df08f5f5';
const bankUser = {
  id: 'some-bank-user-id',
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

  console.log('Invoking registerDecision for reject...');
  try {
    const result = await bankService.registerDecision(
      appId,
      'reject',
      {
        reason: 'Credit score shortfall',
        rejectionCategory: 'POLICY',
        remarks: 'Test rejection comments'
      },
      bankUser
    );
    console.log('Result:', result);
  } catch (err) {
    console.error('Direct Exception Caught:', err);
    if (err.response) {
      console.error('Response details:', err.response);
    }
  }

  await app.close();
}

debug().catch(console.error);
