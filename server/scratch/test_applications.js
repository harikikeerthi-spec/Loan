const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  console.log("Querying all loan applications...");
  const { data: applications, error } = await supabase.from('LoanApplication').select('id, applicationNumber, firstName, lastName, bank, status, lanNumber, bankWorkflowStatus, bankWorkflowStage');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Fetched ${applications.length} applications:`);
    applications.forEach((app, idx) => {
      console.log(`[${idx}]`, JSON.stringify(app, null, 2));
    });
  }
}

run();
