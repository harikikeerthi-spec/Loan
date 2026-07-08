const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  console.log('Inspecting columns for LoanApplication table:');
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'LoanApplication' 
    ORDER BY ordinal_position
  `);
  
  res.rows.forEach(row => {
    console.log(` - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default})`);
  });
  
  await client.end();
}

run().catch(console.error);
