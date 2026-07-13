const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  console.log('Connected to DB. Altering LoanApplication column applicationNumber to drop NOT NULL...');

  try {
    // Alter column to drop NOT NULL constraint
    await client.query(`
      ALTER TABLE "LoanApplication" 
      ALTER COLUMN "applicationNumber" DROP NOT NULL
    `);
    console.log('Successfully dropped NOT NULL constraint on LoanApplication.applicationNumber.');

    // Also verify if there is an ApplyLoan table constraint issue
    console.log('Altering ApplyLoan column applicationNumber to drop NOT NULL...');
    await client.query(`
      ALTER TABLE "ApplyLoan" 
      ALTER COLUMN "applicationNumber" DROP NOT NULL
    `);
    console.log('Successfully dropped NOT NULL constraint on ApplyLoan.applicationNumber.');

  } catch (error) {
    console.error('Error during database migration:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
