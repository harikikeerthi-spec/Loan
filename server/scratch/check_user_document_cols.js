
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'UserDocument' });
    if (error) {
        // Fallback: try to select one row and check keys
        const { data: row, error: rowError } = await supabase.from('UserDocument').select('*').limit(1).single();
        if (rowError) {
            console.error('Error fetching row:', rowError);
        } else {
            console.log('Columns found in row:', Object.keys(row));
        }
    } else {
        console.log('Columns:', data);
    }
}

checkColumns();
