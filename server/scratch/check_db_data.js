const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function checkDbData() {
  try {
    console.log('=== CHECKING BANKS ===');
    const { data: banks, error: banksError } = await db.from('Bank').select('id, name, shortName, type');
    if (banksError) {
      console.error('Error fetching banks:', banksError);
    } else {
      console.log('Banks found in DB:', banks);
    }

    console.log('\n=== CHECKING BANK USERS ===');
    const { data: bankUsers, error: usersError } = await db.from('User').select('id, email, role, firstName, lastName').eq('role', 'bank');
    if (usersError) {
      console.error('Error fetching bank users:', usersError);
    } else {
      console.log('Bank Users found in DB:', bankUsers);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

checkDbData().then(() => process.exit(0));
