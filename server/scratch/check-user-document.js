const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserDocument() {
    console.log('Checking UserDocument columns and table state...');
    
    // Fetch one row to see existing columns
    const { data: firstRow, error: rowError } = await supabase
        .from('UserDocument')
        .select('*')
        .limit(1);
        
    if (rowError) {
        console.error('Error fetching from UserDocument:', rowError);
        return;
    }
    
    if (firstRow && firstRow.length > 0) {
        console.log('UserDocument Columns:', Object.keys(firstRow[0]));
        console.log('Sample Row data:', firstRow[0]);
    } else {
        console.log('No rows found in UserDocument. Let\'s try listing all table columns via postgres metadata API if available, or print empty.');
    }
}

checkUserDocument();
