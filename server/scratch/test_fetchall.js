const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testFindAll() {
  console.log('Testing UsersService.findAll()...');
  const { data, error } = await supabase.from('User').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} users.`);
  try {
    const sorted = data.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, createdAt: u.createdAt }));
    console.log('Success mapping users.');
  } catch (e) {
    console.error('Error mapping users:', e);
  }
}

testFindAll();
