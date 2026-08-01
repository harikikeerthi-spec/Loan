require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function testSupabaseUpdate() {
  console.log('--- TESTING SUPABASE USER UPDATE FIX ---');

  const testEmail = 'chinnu2341@gmail.com';

  // 1. Fetch user by email
  const { data: user, error: fetchErr } = await supabase.from('User').select('*').eq('email', testEmail).maybeSingle();
  if (fetchErr || !user) {
    console.log('User not found by email, inserting test user...');
  } else {
    console.log('Found existing user:', user.id, user.email);
  }

  // 2. Test payload containing non-User columns (academic, family, coApplicant)
  const USER_VALID_COLUMNS = new Set([
    'id', 'email', 'firstName', 'lastName', 'phoneNumber', 'dateOfBirth',
    'mobile', 'password', 'refreshToken', 'referralCode', 'referredById',
    'role', 'createdAt', 'updatedAt', 'goal', 'studyDestination', 'courseName',
    'targetUniversity', 'intakeSeason', 'bachelorsDegree', 'workExp', 'gpa',
    'entranceTest', 'entranceScore', 'englishTest', 'englishScore', 'budget',
    'pincode', 'loanAmount', 'admitStatus', 'tests'
  ]);

  function sanitizeUserPayload(payload) {
    const sanitized = {};
    for (const [key, value] of Object.entries(payload)) {
      if (USER_VALID_COLUMNS.has(key) && value !== undefined) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  const rawPayload = {
    firstName: 'ChinnuUpdated',
    lastName: 'Tested',
    phoneNumber: '9876543210',
    targetUniversity: 'University of Cologne',
    studyDestination: 'Germany',
    academic: { ug: { institute: 'IIT Bombay', percentage: '90' }, gpa: 9.0 },
    family: { fatherName: 'Father Chinnu', fatherAadhar: '123412341234' },
    coApplicant: { name: 'CoApp Chinnu', relation: 'Father' }
  };

  const safePayload = sanitizeUserPayload(rawPayload);
  console.log('Sanitized payload for User table:', safePayload);

  if (user) {
    const { data: updated, error: updateErr } = await supabase
      .from('User')
      .update(safePayload)
      .eq('id', user.id)
      .select()
      .single();

    if (updateErr) {
      console.error('❌ Supabase update error:', updateErr);
    } else {
      console.log('🎉 SUCCESS: Supabase User table update succeeded without PGRST204 errors!');
      console.log('Updated user:', updated.id, updated.firstName, updated.lastName, updated.targetUniversity);
    }
  }

  // 3. Upsert parent record into parents table
  if (user) {
    const { data: parentData, error: parentErr } = await supabase
      .from('parents')
      .upsert({
        userId: user.id,
        relation: 'father',
        name: 'Father Chinnu',
        aadharNumber: '123412341234',
        updatedAt: new Date().toISOString()
      })
      .select();

    if (parentErr) {
      console.error('❌ Parent table upsert error:', parentErr);
    } else {
      console.log('🎉 SUCCESS: Parent table row upserted cleanly:', parentData);
    }
  }

  console.log('--- TEST COMPLETE ---');
}

testSupabaseUpdate();
