const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BankWorkflowService } = require('../dist/bank/bank-workflow.service');
const { SupabaseService } = require('../dist/supabase/supabase.service');

async function run() {
  console.log('Bootstrapping NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const workflowService = app.get(BankWorkflowService);
  const supabaseService = app.get(SupabaseService);
  const db = supabaseService.getClient();

  const dummyUserId = 'VL-STU-2026-00039'; 
  const dummyAppId = 'la-test-' + Date.now();

  try {
    console.log('Inserting dummy LoanApplication...');
    const { data, error } = await db.from('LoanApplication').insert({
      id: dummyAppId,
      userId: dummyUserId,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@vtuapp.com',
      bank: 'Any Bank',
      loanType: 'Postgraduate Abroad',
      amount: 1500000,
      status: 'submitted',
      stage: 'application_submitted',
      progress: 15,
      applicationNumber: 'VL-APP-2026-99991',
      updatedAt: new Date().toISOString()
    }).select();

    if (error) {
      console.error('Insert failed:', error);
      return;
    }
    console.log('Insert succeeded, row:', data);

    console.log('Calling submitApplicationToBank...');
    const result = await workflowService.submitApplicationToBank(
      dummyAppId,
      'auxilo',
      'Auxilo Finserve',
      'Test Staff'
    );
    console.log('Service result:', result);

    console.log('Retrieving application after submit...');
    const { data: updatedApp } = await db
      .from('LoanApplication')
      .select('id, applicationNumber, status, bank, bankSubmissionId, bankWorkflowStatus')
      .eq('id', dummyAppId)
      .single();
      
    console.log('Updated Application in DB:', updatedApp);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    console.log('Cleaning up test data...');
    // Delete BankSubmission
    await db.from('BankSubmission').delete().eq('applicationId', dummyAppId);
    // Delete LoanApplication
    await db.from('LoanApplication').delete().eq('id', dummyAppId);
    console.log('Cleanup complete.');
    await app.close();
  }
}

run().catch(console.error);
