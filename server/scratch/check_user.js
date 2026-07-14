const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const db = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: users, error } = await db.from('User')
      .select('id, email, role, firstName, lastName, referralCode')
      .or('firstName.ilike.%wqedw%,lastName.ilike.%wr%,email.ilike.%wqedw%');
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Matching Users:', users);
    }
  } catch (err) {
    console.error(err);
  }
}

check();
