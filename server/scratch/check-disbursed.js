const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const db = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check disbursements table
  const { data: disb, error: disbErr } = await db.from('disbursements').select('disbursementAmount, id').limit(10);
  console.log('disbursements error:', disbErr);
  console.log('disbursements count:', disb?.length, 'sample:', JSON.stringify(disb?.slice(0,3)));

  // Check LoanApplication statuses
  const { data: apps, error: appErr } = await db.from('LoanApplication').select('status, amount').limit(50);
  console.log('LoanApplication error:', appErr);
  const statusCounts = {};
  (apps || []).forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
  console.log('Status distribution:', JSON.stringify(statusCounts));
  const disbursedApps = (apps || []).filter(a => a.status === 'disbursed');
  console.log('Disbursed apps:', disbursedApps.length, 'Total amount:', disbursedApps.reduce((s, a) => s + (a.amount || 0), 0));
}

main().catch(console.error);
