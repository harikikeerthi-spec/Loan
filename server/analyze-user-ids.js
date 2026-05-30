const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './server/.env';
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function analyzeUserIds() {
  console.log('\n📊 Analyzing All User IDs\n');
  console.log('═'.repeat(100));

  // Fetch all student user IDs
  const { data: allUsers, error } = await supabase
    .from('User')
    .select('id, email, firstName, lastName')
    .like('id', 'VL-STU-2026-%')
    .order('id', { ascending: false });

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  console.log(`\n📋 Total Student Users: ${allUsers.length}\n`);

  // Categorize by format
  const sequential = [];
  const emailHash = [];

  allUsers.forEach(user => {
    const parts = user.id.split('-');
    const suffix = parts[3];
    
    // Check if it's sequential (00001-00999 format with leading zeros)
    if (/^\d{5}$/.test(suffix) && suffix.startsWith('0')) {
      sequential.push({ ...user, seq: parseInt(suffix) });
    } else {
      emailHash.push({ ...user, hash: suffix });
    }
  });

  console.log(`📈 Format Breakdown:`);
  console.log(`   Sequential (VL-STU-2026-0XXXX): ${sequential.length}`);
  console.log(`   Email-Hash (VL-STU-2026-XXXXX): ${emailHash.length}`);
  console.log(`\n${'─'.repeat(100)}`);

  if (sequential.length > 0) {
    console.log(`\n✅ SEQUENTIAL IDs (${sequential.length} total):`);
    console.log(`${'─'.repeat(100)}`);
    console.log('ID                   | Sequence | Email                      | Name');
    console.log(`${'─'.repeat(100)}`);
    
    sequential.sort((a, b) => b.seq - a.seq).forEach(user => {
      console.log(`${user.id.padEnd(20)} | ${String(user.seq).padStart(8)} | ${(user.email || 'N/A').padEnd(26)} | ${(user.firstName || '').slice(0, 20)}`);
    });
    
    const minSeq = Math.min(...sequential.map(u => u.seq));
    const maxSeq = Math.max(...sequential.map(u => u.seq));
    console.log(`${'─'.repeat(100)}`);
    console.log(`Range: ${String(minSeq).padStart(5, '0')} to ${String(maxSeq).padStart(5, '0')}`);
  }

  if (emailHash.length > 0) {
    console.log(`\n⚠️  EMAIL-HASH IDs (${emailHash.length} total):`);
    console.log(`${'─'.repeat(100)}`);
    console.log('ID                   | Hash     | Email                      | Name');
    console.log(`${'─'.repeat(100)}`);
    
    emailHash.sort((a, b) => b.hash.localeCompare(a.hash)).forEach(user => {
      console.log(`${user.id.padEnd(20)} | ${user.hash.padEnd(8)} | ${(user.email || 'N/A').padEnd(26)} | ${(user.firstName || '').slice(0, 20)}`);
    });
  }

  console.log(`\n${'═'.repeat(100)}`);
  console.log(`\n🔍 ANALYSIS:\n`);
  
  if (sequential.length > 0 && emailHash.length > 0) {
    console.log(`❌ ERROR FOUND: Mixed ID formats in database!`);
    console.log(`   - Found ${sequential.length} sequential IDs (format: 00001-00999)`);
    console.log(`   - Found ${emailHash.length} email-hash IDs (format: various 5-digit numbers)`);
    console.log(`\n   The system previously used email-hash method, then switched to sequential.`);
    console.log(`   This causes the sequential counter to not work correctly.\n`);
    
    const maxSeq = Math.max(...sequential.map(u => u.seq));
    console.log(`✅ RECOMMENDATION:`);
    console.log(`   The next sequential ID should be: VL-STU-2026-${String(maxSeq + 1).padStart(5, '0')}`);
    console.log(`   (not VL-STU-2026-88581 as currently implemented)\n`);
  } else if (sequential.length > 0) {
    console.log(`✅ All IDs are in sequential format`);
    const maxSeq = Math.max(...sequential.map(u => u.seq));
    console.log(`   Next ID will be: VL-STU-2026-${String(maxSeq + 1).padStart(5, '0')}\n`);
  } else if (emailHash.length > 0) {
    console.log(`⚠️  All IDs are in email-hash format`);
    console.log(`   System needs migration to sequential format\n`);
  }

  console.log(`${'═'.repeat(100)}\n`);
}

analyzeUserIds();
