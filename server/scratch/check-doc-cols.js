const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocColumns() {
    console.log('Checking ApplicationDocument columns...');
    const { data, error } = await supabase
        .from('ApplicationDocument')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error fetching document:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data found in ApplicationDocument table.');
    }
}

checkDocColumns();
