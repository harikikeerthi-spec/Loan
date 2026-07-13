const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { UsersService } = require('../dist/users/users.service');
const { SupabaseService } = require('../dist/supabase/supabase.service');

async function run() {
  console.log('Bootstrapping NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const supabaseService = app.get(SupabaseService);
  const db = supabaseService.getClient();

  const testUserId = 'VL-STU-2026-00040'; // waeq rewr

  try {
    // 1. Get initial User & LoanApplication state
    console.log('\n=== Checking initial DB State ===');
    const { data: userBefore } = await db.from('User').select('id, family, coApplicant').eq('id', testUserId).single();
    const { data: appsBefore } = await db.from('LoanApplication').select('id, fatherName, motherName, coApplicantName').eq('userId', testUserId);
    
    console.log('User family before:', userBefore.family);
    console.log('User coApplicant before:', userBefore.coApplicant);
    console.log('Loan applications count before:', appsBefore ? appsBefore.length : 0);
    if (appsBefore && appsBefore.length > 0) {
      console.log('First App before:', appsBefore[0]);
    }

    // 2. Simulate Father Document OCR Upload
    console.log('\n=== Simulating Father Document OCR Upload ===');
    await usersService.updateExtractedDetails(testUserId, {
      documentVerified: true,
      fullName: 'Vikram Singh Rewr',
      aadhaar_number: '123456789012'
    }, 'father_aadhar');

    // 3. Simulate Mother Document OCR Upload
    console.log('\n=== Simulating Mother Document OCR Upload ===');
    await usersService.updateExtractedDetails(testUserId, {
      documentVerified: true,
      name: 'Sunita Devi Rewr',
      pan_number: 'ABCDE1234F'
    }, 'mother_pan');

    // 4. Simulate Co-applicant Document OCR Upload
    console.log('\n=== Simulating Co-applicant Document OCR Upload ===');
    await usersService.updateExtractedDetails(testUserId, {
      documentVerified: true,
      full_name: 'Amit Kumar Rewr',
      pan_number: 'XYZWY9876A'
    }, 'coapplicant_pan');

    // 5. Verify database updates
    console.log('\n=== Checking DB State after updates ===');
    const { data: userAfter } = await db.from('User').select('id, family, coApplicant').eq('id', testUserId).single();
    const { data: appsAfter } = await db.from('LoanApplication').select('id, fatherName, motherName, coApplicantName').eq('userId', testUserId);

    console.log('User family after:', userAfter.family);
    console.log('User coApplicant after:', userAfter.coApplicant);
    if (appsAfter && appsAfter.length > 0) {
      console.log('First App after:', appsAfter[0]);
    }

    // Assertions
    const familyObj = typeof userAfter.family === 'string' ? JSON.parse(userAfter.family) : userAfter.family;
    const coappObj = typeof userAfter.coApplicant === 'string' ? JSON.parse(userAfter.coApplicant) : userAfter.coApplicant;

    console.log('\n=== Verification Status ===');
    if (familyObj?.fatherName === 'Vikram Singh Rewr') {
      console.log('✅ Father name successfully updated in User profile!');
    } else {
      console.error('❌ Father name NOT updated in User profile!');
    }

    if (familyObj?.motherName === 'Sunita Devi Rewr') {
      console.log('✅ Mother name successfully updated in User profile!');
    } else {
      console.error('❌ Mother name NOT updated in User profile!');
    }

    if (coappObj?.name === 'Amit Kumar Rewr') {
      console.log('✅ Co-applicant name successfully updated in User profile!');
    } else {
      console.error('❌ Co-applicant name NOT updated in User profile!');
    }

    if (appsAfter && appsAfter.length > 0) {
      const app = appsAfter[0];
      if (app.fatherName === 'Vikram Singh Rewr' && app.motherName === 'Sunita Devi Rewr' && app.coApplicantName === 'Amit Kumar Rewr') {
        console.log('✅ LoanApplication columns synced successfully!');
      } else {
        console.error('❌ LoanApplication columns NOT synced correctly!', app);
      }
    } else {
      console.log('ℹ️ No active LoanApplication to verify sync (which is fine if user has no applications).');
    }

    // 6. Cleanup
    console.log('\n=== Cleaning up test data ===');
    const resetFamily = familyObj ? { ...familyObj, fatherName: '', motherName: '' } : null;
    const resetCoapp = coappObj ? { ...coappObj, name: '' } : null;
    
    await db.from('User').update({ family: resetFamily, coApplicant: resetCoapp }).eq('id', testUserId);
    await db.from('LoanApplication').update({ fatherName: null, motherName: null, coApplicantName: null }).eq('userId', testUserId);
    console.log('Cleanup complete!');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await app.close();
  }
}

run().catch(console.error);
