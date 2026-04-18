const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'User' });
  
  if (error) {
    // If RPC doesn't exist, try a raw query if possible
    console.log('RPC failed, trying information_schema...');
    const { data: schema, error: schemaError } = await supabase
      .from('User')
      .select('id')
      .limit(1);
      
    if (schemaError) {
      console.error('Error selecting from User:', schemaError);
    } else {
      console.log('Select successful,id exists:', schema);
    }
    
    // Check if we can get column info from information_schema
    const { data: cols, error: colsErr } = await supabase.rpc('get_cols', { t_name: 'User' });
    console.log('Cols:', cols, 'Error:', colsErr);
  } else {
    console.log('User Table Columns:', data);
  }
}

checkSchema();
