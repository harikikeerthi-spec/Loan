const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  console.log('Connected to DB for multi-bank routing verification.');

  try {
    // 1. Verify Bank Priorities
    console.log('--- 1. Verifying Bank Priorities ---');
    const prioritiesRes = await client.query('SELECT * FROM "BankPriority" ORDER BY priority ASC');
    console.log(`Found ${prioritiesRes.rows.length} bank priorities:`);
    prioritiesRes.rows.forEach((r) => {
      console.log(`Priority ${r.priority}: ${r.bankName} (${r.status})`);
    });

    // 2. Fetch or create a mock loan application
    console.log('\n--- 2. Setting Up Test Loan Application ---');
    let appRes = await client.query(`SELECT id, status, bank FROM "LoanApplication" LIMIT 1`);
    if (appRes.rows.length === 0) {
      console.log('No applications found in the database. Inserting mock application...');
      await client.query(`
        INSERT INTO "LoanApplication" (
          id, "applicationNumber", "userId", "loanType", bank, status, "progress",
          "firstName", "lastName", email, phone, amount, "createdAt", "updatedAt"
        ) VALUES (
          'test-app-id', 'APP-TEST-ANY', 'test-user-id', 'education', 'ANY BANK', 'submitted', 25,
          'Test', 'Student', 'test@student.com', '+919999999999', 2000000, NOW(), NOW()
        )
      `);
      appRes = await client.query(`SELECT id, status, bank FROM "LoanApplication" WHERE id = 'test-app-id'`);
    }

    const app = appRes.rows[0];
    console.log(`Testing with Application ID: ${app.id}, Bank field: ${app.bank}, Initial Status: ${app.status}`);

    // Update bank to 'ANY BANK' if not set
    if (app.bank !== 'ANY BANK') {
      console.log('Updating bank field to ANY BANK for test routing...');
      await client.query(`UPDATE "LoanApplication" SET bank = 'ANY BANK' WHERE id = $1`, [app.id]);
    }

    // 3. Simulate multi-bank routing
    console.log('\n--- 3. Simulating Multi-Bank Routing ---');
    const selectedBanks = [
      { id: 'avanse', name: 'Avanse Financial' },
      { id: 'credila', name: 'HDFC Credila' },
      { id: 'idfc', name: 'IDFC FIRST Bank' }
    ];

    console.log(`Route application to: ${selectedBanks.map(b => b.name).join(', ')}`);

    // Clean up any existing test submissions first
    await client.query('DELETE FROM "BankSubmission" WHERE "applicationId" = $1', [app.id]);

    const createdSubmissions = [];
    const submittedBy = 'System Tester';

    for (const bank of selectedBanks) {
      const subRes = await client.query(`
        INSERT INTO "BankSubmission" (
          "applicationId", "bankId", "bankName", "submittedBy", "workflowStatus", "currentStage", "statusHistory"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, "bankName", "workflowStatus"
      `, [
        app.id,
        bank.id,
        bank.name,
        submittedBy,
        'SUBMITTED_TO_BANK',
        'SUBMITTED_TO_BANK',
        JSON.stringify([{
          fromStatus: null,
          toStatus: 'SUBMITTED_TO_BANK',
          changedAt: new Date().toISOString(),
          changedBy: submittedBy,
          reason: 'Application shared with bank via multiparty routing'
        }])
      ]);
      const created = subRes.rows[0];
      createdSubmissions.push(created);
      console.log(`Created BankSubmission: ID=${created.id}, Bank=${created.bankName}, Status=${created.workflowStatus}`);
    }

    // Update LoanApplication status to ROUTED_MULTIPARTY and bank to targeted list
    const bankNamesStr = selectedBanks.map(b => b.name).join(', ');
    await client.query(`
      UPDATE "LoanApplication" 
      SET 
        status = 'ROUTED_MULTIPARTY',
        "bankWorkflowStatus" = 'SUBMITTED_TO_BANK',
        "bankWorkflowStage" = 'SUBMITTED_TO_BANK',
        "submittedToBankAt" = NOW(),
        "bankSubmissionId" = $1,
        bank = $2
      WHERE id = $3
    `, [createdSubmissions[0].id, bankNamesStr, app.id]);

    console.log('LoanApplication status updated to ROUTED_MULTIPARTY.');

    // 4. Verify updates
    console.log('\n--- 4. Verifying Results in DB ---');
    const updatedAppRes = await client.query(`SELECT id, status, bank, "bankSubmissionId" FROM "LoanApplication" WHERE id = $1`, [app.id]);
    const updatedApp = updatedAppRes.rows[0];
    console.log('Updated LoanApplication:');
    console.log(`- Status: ${updatedApp.status} (Expected: ROUTED_MULTIPARTY)`);
    console.log(`- Bank list: ${updatedApp.bank} (Expected: Avanse Financial, HDFC Credila, IDFC FIRST Bank)`);
    console.log(`- Primary bankSubmissionId: ${updatedApp.bankSubmissionId}`);

    const verifiedSubmissionsRes = await client.query('SELECT * FROM "BankSubmission" WHERE "applicationId" = $1', [app.id]);
    console.log(`\nVerified Submissions in DB (${verifiedSubmissionsRes.rows.length} total):`);
    verifiedSubmissionsRes.rows.forEach((s) => {
      console.log(`- Bank: ${s.bankName}, Status: ${s.workflowStatus}, Created: ${s.created_at || s.createdAt || 'N/A'}`);
    });

    if (
      updatedApp.status === 'ROUTED_MULTIPARTY' &&
      verifiedSubmissionsRes.rows.length === 3
    ) {
      console.log('\n✅ Multi-bank routing verification PASSED successfully!');
    } else {
      console.log('\n❌ Multi-bank routing verification FAILED.');
    }

  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
