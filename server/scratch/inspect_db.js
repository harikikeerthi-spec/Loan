const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.error('Failed to load env:', err.message);
  }
}

loadEnv();

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: apps, error: err1 } = await supabase
      .from('LoanApplication')
      .select('id, applicationNumber, firstName, lastName, status, stage, evvOverall, evvStatus, evvMonthlyBreakdown, bank, remarks')
      .eq('id', '61e9829c-a887-417a-bded-58d9b98683da')
      .single();
    
    if (err1) throw err1;
    console.log('Application:');
    console.log(apps);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
