const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  console.log('Checking triggers for LoanApplication:');
  const res = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement, action_timing
    FROM information_schema.triggers
    WHERE event_object_table = 'LoanApplication'
  `);
  
  if (res.rows.length === 0) {
    console.log('No triggers found on LoanApplication.');
  } else {
    res.rows.forEach(row => {
      console.log(` - Trigger: ${row.trigger_name} | Event: ${row.event_manipulation} | Timing: ${row.action_timing}`);
      console.log(`   Statement: ${row.action_statement}`);
    });
  }
  
  await client.end();
}

run().catch(console.error);
