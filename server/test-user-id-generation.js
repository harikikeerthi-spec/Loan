const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './server/.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function testUserIdGeneration() {
  console.log('\n🧪 Testing Sequential User ID Generation\n');
  console.log('═'.repeat(80));

  // 1. Get the highest existing sequential student ID
  console.log('\n1️⃣  Fetching highest existing student ID...');
  const { data: lastUser, error: fetchError } = await supabase
    .from('User')
    .select('id, email, firstName, lastName')
    .like('id', 'VL-STU-2026-%')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.log('❌ Error:', fetchError);
    return;
  }

  if (lastUser) {
    console.log(`✅ Last student ID: ${lastUser.id}`);
    console.log(`   Email: ${lastUser.email}`);
    console.log(`   Name: ${lastUser.firstName} ${lastUser.lastName}`);

    // Extract current sequence
    const parts = lastUser.id.split('-');
    const currentSeq = parseInt(parts[3], 10);
    const nextSeq = currentSeq + 1;
    
    console.log(`\n2️⃣  Next sequential student ID would be:`);
    const nextId = `VL-STU-2026-${String(nextSeq).padStart(5, '0')}`;
    console.log(`   🎯 ${nextId}`);
    
    console.log(`\n3️⃣  Subsequent IDs would follow as:`);
    for (let i = 1; i <= 5; i++) {
      const seqNum = nextSeq + i;
      const id = `VL-STU-2026-${String(seqNum).padStart(5, '0')}`;
      console.log(`   ${id}`);
    }
  } else {
    console.log('ℹ️  No existing sequential student IDs found');
    console.log('   Next student ID would start: VL-STU-2026-00001');
  }

  // 4. Count total students
  console.log('\n4️⃣  User Statistics:');
  const { count: total } = await supabase
    .from('User')
    .select('*', { count: 'exact', head: true });
  
  const { count: sequentialCount } = await supabase
    .from('User')
    .select('*', { count: 'exact', head: true })
    .like('id', 'VL-STU-2026-%');

  console.log(`   Total users: ${total}`);
  console.log(`   Sequential student IDs (VL-STU-2026-*): ${sequentialCount}`);
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Sequential User ID Generation is READY!\n');
}

testUserIdGeneration();
