const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function checkApplications() {
  try {
    console.log('\n=== CHECKING LOAN APPLICATIONS TABLE ===\n');

    // Get all applications
    const { data: allApps, error: allAppsError } = await db
      .from('LoanApplication')
      .select('id, userId, email, bank, loanType, amount, status, stage, firstName, lastName, submittedAt, createdAt')
      .order('createdAt', { ascending: false })
      .limit(50);

    if (allAppsError) {
      console.error('Error fetching applications:', allAppsError);
      return;
    }

    console.log(`Total applications found: ${allApps?.length || 0}\n`);

    if (allApps && allApps.length > 0) {
      console.log('Recent Applications:');
      allApps.forEach((app, idx) => {
        console.log(`\n[${idx + 1}]`);
        console.log(`  ID: ${app.id}`);
        console.log(`  UserId: ${app.userId}`);
        console.log(`  Email: ${app.email}`);
        console.log(`  Name: ${app.firstName} ${app.lastName}`);
        console.log(`  Bank: ${app.bank}`);
        console.log(`  Loan Type: ${app.loanType}`);
        console.log(`  Amount: ₹${app.amount}`);
        console.log(`  Status: ${app.status}`);
        console.log(`  Stage: ${app.stage}`);
        console.log(`  Submitted At: ${app.submittedAt}`);
        console.log(`  Created At: ${app.createdAt}`);
      });
    } else {
      console.log('No applications found in database.');
    }

    // Check for applications without userId
    const { data: noUserId } = await db
      .from('LoanApplication')
      .select('id, email, bank, status')
      .is('userId', null);

    if (noUserId && noUserId.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${noUserId.length} applications without userId:`);
      noUserId.forEach(app => {
        console.log(`  - ID: ${app.id}, Email: ${app.email}, Bank: ${app.bank}, Status: ${app.status}`);
      });
    }

    // Check table structure
    console.log('\n=== TABLE STRUCTURE ===\n');
    const { data: columns, error: colError } = await db.rpc('get_table_columns', {
      table_name: 'LoanApplication'
    }).catch(() => null);

    if (!columns) {
      console.log('Could not fetch column info via RPC. Checking sample row structure...');
      if (allApps && allApps[0]) {
        console.log('Sample row columns:', Object.keys(allApps[0]));
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkApplications().then(() => {
  console.log('\n=== CHECK COMPLETE ===\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
