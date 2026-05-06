const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function testApplicationCreation() {
  try {
    console.log('\n=== TESTING APPLICATION CREATION ===\n');

    // First, check what columns exist in LoanApplication
    console.log('1. Checking LoanApplication table structure...');
    const { data: sample, error: sampleError } = await db
      .from('LoanApplication')
      .select('*')
      .limit(1);

    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('   Error accessing table:', sampleError);
      return;
    }

    if (sample && sample.length > 0) {
      const cols = Object.keys(sample[0]);
      console.log('   Available columns:', cols);
    } else {
      // Try to get info differently - check what insert would look like
      console.log('   Table appears empty. Attempting test insert...');
      
      const testData = {
        userId: 'test-user-' + Date.now(),
        bank: 'IDFC',
        loanType: 'education',
        amount: 1000000,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        status: 'pending',
        stage: 'application_submitted',
        progress: 10,
      };

      console.log('\n2. Testing INSERT with data:', JSON.stringify(testData, null, 2));
      
      const { data: inserted, error: insertError } = await db
        .from('LoanApplication')
        .insert(testData)
        .select();

      if (insertError) {
        console.error('\n   ❌ INSERT FAILED:');
        console.error('   Code:', insertError.code);
        console.error('   Message:', insertError.message);
        console.error('   Details:', insertError.details);
        console.error('   Hint:', insertError.hint);
        
        if (insertError.code === '42703') {
          console.log('\n   ACTION: Column does not exist. Need to update schema or use correct column names.');
        } else if (insertError.code === '42601') {
          console.log('\n   ACTION: SQL syntax error. Check insert structure.');
        } else if (insertError.code === 'PGRST116') {
          console.log('\n   ACTION: Table might not exist.');
        }
      } else {
        console.log('\n   ✅ INSERT SUCCESSFUL!');
        console.log('   Inserted record:', inserted);
        
        // Try to retrieve it
        const { data: retrieved } = await db
          .from('LoanApplication')
          .select('*')
          .eq('userId', testData.userId);
        
        console.log('\n   Retrieved record:', retrieved);
        
        // Clean up
        await db
          .from('LoanApplication')
          .delete()
          .eq('userId', testData.userId);
      }
    }

    // Also check if there are any users
    console.log('\n3. Checking User table...');
    const { data: users, error: usersError } = await db
      .from('User')
      .select('id, email, firstName, lastName')
      .limit(5);

    if (usersError) {
      console.error('   Error accessing User table:', usersError);
    } else {
      console.log(`   Found ${users?.length || 0} users`);
      if (users && users.length > 0) {
        console.log('   Sample users:');
        users.slice(0, 3).forEach(u => {
          console.log(`     - ${u.email} (ID: ${u.id.substring(0, 8)}...)`);
        });
      }
    }

  } catch (err) {
    console.error('Fatal error:', err);
  }
}

testApplicationCreation().then(() => {
  console.log('\n=== TEST COMPLETE ===\n');
  process.exit(0);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
