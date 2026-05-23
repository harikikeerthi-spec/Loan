const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  console.log('Adding foreign key constraint from QueryResponse.queryId to BankQuery.id...');
  try {
    // Check if the constraint already exists
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'QueryResponse_queryId_fkey'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('Constraint QueryResponse_queryId_fkey already exists. Dropping it first...');
      await client.query('ALTER TABLE "QueryResponse" DROP CONSTRAINT "QueryResponse_queryId_fkey"');
    }

    await client.query(`
      ALTER TABLE "QueryResponse" 
      ADD CONSTRAINT "QueryResponse_queryId_fkey" 
      FOREIGN KEY ("queryId") 
      REFERENCES "BankQuery"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `);
    console.log('✅ Success: Foreign key constraint added successfully.');
  } catch (err) {
    console.error('❌ Error adding constraint:', err.message);
  }

  // Grant privileges
  try {
    await client.query('GRANT ALL PRIVILEGES ON TABLE "QueryResponse" TO postgres, anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON TABLE "BankQuery" TO postgres, anon, authenticated, service_role;');
    console.log('✅ Privileges granted.');
  } catch (err) {
    console.error('❌ Error granting privileges:', err.message);
  }

  await client.end();
}

run();
