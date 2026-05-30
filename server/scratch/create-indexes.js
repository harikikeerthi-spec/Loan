const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  console.log('--- Creating Indexes on Hot Columns ---');
  
  const queries = [
    // LoanApplication Indexes
    "CREATE INDEX IF NOT EXISTS idx_loan_app_status ON \"LoanApplication\" (status)",
    "CREATE INDEX IF NOT EXISTS idx_loan_app_bank ON \"LoanApplication\" (bank)",
    "CREATE INDEX IF NOT EXISTS idx_loan_app_priority_level ON \"LoanApplication\" (\"priorityLevel\")",
    "CREATE INDEX IF NOT EXISTS idx_loan_app_lan_number ON \"LoanApplication\" (\"lanNumber\")",
    "CREATE INDEX IF NOT EXISTS idx_loan_app_user_id ON \"LoanApplication\" (\"userId\")",
    "CREATE INDEX IF NOT EXISTS idx_loan_app_submitted_at ON \"LoanApplication\" (\"submittedAt\")",
    
    // Notification Indexes
    "CREATE INDEX IF NOT EXISTS idx_notification_user_id ON \"Notification\" (\"userId\")",
    "CREATE INDEX IF NOT EXISTS idx_notification_type ON \"Notification\" (type)",
    "CREATE INDEX IF NOT EXISTS idx_notification_is_read ON \"Notification\" (\"isRead\")",
    "CREATE INDEX IF NOT EXISTS idx_notification_timestamp ON \"Notification\" (timestamp)",
    
    // queries Indexes
    "CREATE INDEX IF NOT EXISTS idx_queries_application_id ON queries (\"applicationId\")",
    "CREATE INDEX IF NOT EXISTS idx_queries_status ON queries (status)"
  ];

  for (const sql of queries) {
    try {
      console.log(`Executing: ${sql}`);
      await client.query(sql);
      console.log('Success!');
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }
  
  await client.end();
  console.log('--- Database Indexing Completed ---');
}
main().catch(console.error);
