const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const db = createClient(supabaseUrl, supabaseKey);

function convertToIndiaTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} IST`;
}

async function testInsert() {
  const testEmail = `test_${Date.now()}@example.com`;
  const insertPayload = {
    id: `USER-${Date.now()}`,
    email: testEmail,
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '9999999999',
    dateOfBirth: null,
    mobile: '9999999999',
    password: '',
    role: 'user',
    registeredAtIndia: convertToIndiaTime(new Date()),
    referralCode: 'TEST' + Math.floor(1000 + Math.random() * 9000),
  };

  console.log('Attempting insert with payload:', insertPayload);
  const { data, error } = await db.from('User').insert(insertPayload).select().single();
  if (error) {
    console.error('Insert failed with error:', error);
  } else {
    console.log('Insert successful! User created:', data.id, 'registeredAtIndia:', data.registeredAtIndia);
    // Cleanup
    await db.from('User').delete().eq('id', data.id);
    console.log('Test user cleaned up.');
  }
}

testInsert();
