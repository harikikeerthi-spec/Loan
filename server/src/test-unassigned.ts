import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function testQuery() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing query 1 (current code in assignAllUnassigned)...');
  const res1 = await supabase
    .from('LoanApplication')
    .select('id, applicationNumber, loanType, firstName, lastName, email, assignedStaffId, status')
    .or('assignedStaffId.is.null,assignedStaffId.eq.unassigned,assignedStaffId.eq.,assignedStaffId.eq.null')
    .not('status', 'in', '("rejected","cancelled","draft")');
  
  console.log('Res1 error:', res1.error);
  console.log('Res1 data count:', res1.data?.length);

  console.log('Testing all LoanApplications in DB...');
  const res2 = await supabase
    .from('LoanApplication')
    .select('id, applicationNumber, assignedStaffId, status');
  console.log('All apps count:', res2.data?.length);
  console.log('Apps sample:', res2.data?.slice(0, 10));
}

testQuery();
