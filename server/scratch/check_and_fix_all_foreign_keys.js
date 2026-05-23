const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  const tables = ['BankQuery', 'BankDecision', 'Disbursement', 'ProcessingFee', 'FileQualityRating', 'ReferralFee'];

  console.log('--- Checking Foreign Keys for Bank-Related Tables ---');
  for (const table of tables) {
    const res = await client.query(`
      SELECT
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
    `, [table]);

    console.log(`\nTable: ${table}`);
    if (res.rows.length === 0) {
      console.log('  No foreign keys found!');
      
      // Let's add the missing foreign key to LoanApplication (id)
      console.log(`  Adding foreign key from ${table}."applicationId" to "LoanApplication".id...`);
      try {
        const fkName = `${table}_applicationId_fkey`;
        await client.query(`
          ALTER TABLE "${table}" 
          ADD CONSTRAINT "${fkName}" 
          FOREIGN KEY ("applicationId") 
          REFERENCES "LoanApplication"("id") 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        console.log(`  ✅ Success: Constraint ${fkName} added.`);
      } catch (err) {
        console.error(`  ❌ Error adding foreign key:`, err.message);
      }
    } else {
      res.rows.forEach(r => {
        console.log(`  - Column "${r.column_name}" references "${r.foreign_table_name}"("${r.foreign_column_name}") [Constraint: ${r.constraint_name}]`);
      });
    }
  }

  await client.end();
}

run();
