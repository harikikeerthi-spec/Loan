const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const user = {
    id: 'VL-STU-2026-00006',
    role: 'bank',
    email: 'hellobro24@gmail.com'
  };

  const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin' || user.role === 'super_admin';
  const isBank = user.role === 'bank' || user.role === 'partner_bank';
  const userId = user.id || user.uid || user._id;

  let query = supabase.from('Notification').select('*', { count: 'exact' });

  if (isStaffOrAdmin) {
    query = query.or(`userId.eq.staff,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
  } else if (isBank) {
    query = query.or(`userId.eq.bank,userId.eq.system,userId.eq.all,userId.eq.${userId}`);
  } else {
    query = query.or(`userId.eq.${userId},userId.eq.all`);
  }

  query = query.eq('isRead', false);

  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(0, 29);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Successful! Results:", data, "Count:", count);
  }
}

run();
