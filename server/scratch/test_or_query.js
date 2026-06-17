const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // Test count with head: true
    const { count: c1, error: e1 } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'user');
    console.log('Role user count (eq, head: true):', c1, 'Error:', e1);
    
    const { count: c2, error: e2 } = await supabase.from('User').select('*', { count: 'exact', head: true }).or('role.eq.student,role.eq.user');
    console.log('Role student or user count (or, head: true):', c2, 'Error:', e2);

    const { count: c3, error: e3 } = await supabase.from('User').select('*', { count: 'exact' }).or('role.eq.student,role.eq.user');
    console.log('Role student or user count (or, select):', c3, 'Error:', e3);
}

main().catch(console.error);
