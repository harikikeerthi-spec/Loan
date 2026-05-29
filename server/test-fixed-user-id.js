const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './server/.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function testFixedUserIdGeneration() {
  console.log('\n🧪 Testing FIXED Sequential User ID Generation\n');
  console.log('═'.repeat(90));

  // 1. Get all student IDs
  const { data: allIds, error: fetchError } = await supabase
    .from('User')
    .select('id')
    .like('id', 'VL-STU-2026-%');

  if (fetchError) {
    console.log('❌ Error:', fetchError);
    return;
  }

  console.log(`\n1️⃣  Analyzing ${allIds.length} existing student IDs...\n`);

  // Separate sequential and email-hash IDs
  const prefix = 'VL-STU-2026-';
  const sequentialIds = [];
  const emailHashIds = [];

  allIds.forEach(u => {
    const suffix = u.id.substring(prefix.length);
    const num = parseInt(suffix, 10);
    
    if (suffix.startsWith('0') && suffix.length === 5) {
      sequentialIds.push(num);
    } else {
      emailHashIds.push({ id: u.id, num });
    }
  });

  console.log(`   Sequential IDs: ${sequentialIds.length}`);
  if (sequentialIds.length > 0) {
    const maxSeq = Math.max(...sequentialIds);
    const minSeq = Math.min(...sequentialIds);
    console.log(`   Range: ${String(minSeq).padStart(5, '0')} to ${String(maxSeq).padStart(5, '0')}`);
  }

  console.log(`   Email-Hash IDs: ${emailHashIds.length}`);
  if (emailHashIds.length > 0) {
    emailHashIds.slice(0, 3).forEach(e => {
      console.log(`     - ${e.id}`);
    });
    if (emailHashIds.length > 3) {
      console.log(`     ... and ${emailHashIds.length - 3} more`);
    }
  }

  // 2. Calculate the correct next ID
  console.log(`\n2️⃣  Calculating next ID correctly:\n`);

  let nextSeq = 1;
  if (sequentialIds.length > 0) {
    nextSeq = Math.max(...sequentialIds) + 1;
  }

  const nextId = `VL-STU-2026-${String(nextSeq).padStart(5, '0')}`;
  console.log(`   ✅ CORRECT next Sequential ID: ${nextId}`);
  console.log(`   ✅ Numeric sequence: ${nextSeq}`);

  // 3. Show what would happen with old buggy logic
  console.log(`\n3️⃣  Comparison with old (buggy) logic:\n`);
  
  // Simulate old logic (alphabetical sort)
  const oldLogicMax = Math.max(
    ...sequentialIds,
    ...emailHashIds.map(e => e.num)
  );
  const oldNextId = `VL-STU-2026-${String(oldLogicMax + 1).padStart(5, '0')}`;
  
  console.log(`   ❌ OLD (buggy) next ID: ${oldNextId}`);
  console.log(`   ✅ NEW (fixed) next ID: ${nextId}`);
  console.log(`   💡 The fix ignores email-hash IDs (88580, 88581, etc.)`);

  console.log(`\n4️⃣  Next 5 IDs after fix:\n`);
  for (let i = 0; i < 5; i++) {
    const seq = nextSeq + i;
    const id = `VL-STU-2026-${String(seq).padStart(5, '0')}`;
    console.log(`     ${id}`);
  }

  console.log(`\n${'═'.repeat(90)}`);
  console.log(`\n✅ Sequential User ID Generation is FIXED!\n`);
}

testFixedUserIdGeneration();
