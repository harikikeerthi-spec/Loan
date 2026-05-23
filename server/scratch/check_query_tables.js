const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  console.log('\n=== Table: BankQuery ===');
  let res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'BankQuery'
  `);
  console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  console.log('\n=== Table: QueryResponse ===');
  res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'QueryResponse'
  `);
  console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  console.log('\n=== Table: QueryResponse Foreign Keys ===');
  res = await client.query(`
    SELECT
      tc.table_schema, 
      tc.constraint_name, 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_schema AS foreign_table_schema,
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
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='QueryResponse';
  `);
  console.log(res.rows);

  await client.end();
}

run();
