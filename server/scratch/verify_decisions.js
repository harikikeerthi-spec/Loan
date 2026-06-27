const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function run() {
    console.log('Bootstrapping NestJS application context...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const { BankService } = require('../dist/bank/bank.service');
    const bankService = app.get(BankService);
    const supabaseService = app.get(require('../dist/supabase/supabase.service').SupabaseService);
    const db = supabaseService.getClient();

    // 1. Find a LoanApplication
    const { data: apps, error: fetchErr } = await db
        .from('LoanApplication')
        .select('*')
        .limit(1);

    if (fetchErr || !apps || apps.length === 0) {
        console.error('Error fetching loan application:', fetchErr);
        await app.close();
        return;
    }

    const testApp = apps[0];
    console.log(`Using application ID: ${testApp.id} (Current status: ${testApp.status})`);

    // Force its status to 'submitted_to_bank' so we can test the specific transition
    const { error: updateErr } = await db
        .from('LoanApplication')
        .update({ status: 'submitted_to_bank' })
        .eq('id', testApp.id);

    if (updateErr) {
        console.error('Failed to update application status:', updateErr);
        await app.close();
        return;
    }
    console.log('Successfully set application status to "submitted_to_bank"');

    const bankUser = {
        id: 'test-banker-id',
        email: 'banker@auxilo.com',
        role: 'bank',
        firstName: 'Auxilo Bank Officer',
        lastName: 'Officer'
    };

    // 2. Test recordConsent
    console.log('\n--- Testing recordConsent ---');
    try {
        const consentRes = await bankService.recordConsent(
            testApp.id,
            { consentType: 'officer_override' },
            bankUser
        );
        console.log('recordConsent succeeded:', consentRes);

        // Verify ConsentRecord row in DB
        const { data: consentRecord, error: consentErr } = await db
            .from('ConsentRecord')
            .select('*')
            .eq('applicationId', testApp.id)
            .single();

        if (consentErr) {
            console.error('Failed to retrieve consent record from DB:', consentErr);
        } else {
            console.log('Retrieved consent record from DB:', consentRecord);
        }
    } catch (err) {
        console.error('recordConsent failed:', err);
    }

    // 3. Test registerDecision
    console.log('\n--- Testing registerDecision: Failure Case (LAN is missing) ---');
    try {
        // Set LAN to null
        await db.from('LoanApplication').update({ lanNumber: null }).eq('id', testApp.id);
        console.log('Set application lanNumber to null in DB.');

        await bankService.registerDecision(
            testApp.id,
            'sanction',
            {
                sanctionAmount: 3000000,
                interestRate: 10.5,
                roiType: 'floating',
                tenure: 120,
                remarks: 'Should fail'
            },
            bankUser
        );
        console.error('ERROR: registerDecision succeeded but it should have failed because LAN is missing!');
    } catch (err) {
        console.log('registerDecision failed as expected with error:', err.message);
    }

    console.log('\n--- Testing registerDecision: Success Case (LAN is present) ---');
    try {
        // Set a valid LAN
        await db.from('LoanApplication').update({ lanNumber: 'LAN-VERIFY-12345' }).eq('id', testApp.id);
        console.log('Set application lanNumber to "LAN-VERIFY-12345" in DB.');

        const decisionRes = await bankService.registerDecision(
            testApp.id,
            'sanction',
            {
                sanctionAmount: 3000000,
                interestRate: 10.5,
                roiType: 'floating',
                tenure: 120,
                remarks: 'Verified sanction transition'
            },
            bankUser
        );
        console.log('registerDecision succeeded:', decisionRes.message);

        // Verify updated status in DB
        const { data: updatedApp, error: appErr } = await db
            .from('LoanApplication')
            .select('status')
            .eq('id', testApp.id)
            .single();

        if (appErr) {
            console.error('Failed to retrieve application status from DB:', appErr);
        } else {
            console.log(`Updated application status in DB is: "${updatedApp.status}"`);
        }
    } catch (err) {
        console.error('ERROR: registerDecision failed even though LAN is present:', err);
    }

    // Restore original status and lanNumber
    await db.from('LoanApplication').update({ 
        status: testApp.status, 
        lanNumber: testApp.lanNumber,
        lanEnteredAt: testApp.lanEnteredAt
    }).eq('id', testApp.id);
    console.log(`\nRestored application status to original: "${testApp.status}" and lanNumber to original.`);

    await app.close();
}

run().catch(console.error);
