const { Client } = require('pg');
require('dotenv').config();

const priorities = [
  { priority: 1, bankName: 'Avanse Financial', status: 'Active' },
  { priority: 2, bankName: 'HDFC Credila', status: 'Active' },
  { priority: 3, bankName: 'IDFC FIRST Bank', status: 'Active' },
  { priority: 4, bankName: 'Auxilo Finserve', status: 'Active' },
  { priority: 5, bankName: 'InCred', status: 'Active' },
];

const incredBank = {
  id: 'incred',
  name: 'InCred',
  shortName: 'InCred',
  country: 'India',
  type: 'NBFC',
  loanTypes: ['education'],
  educationLoan: true,
  interestRateMin: 10.25,
  interestRateMax: 13.5,
  maxLoanAmount: '45 Lakhs',
  collateralRequired: false,
  collateralFreeLimit: '40 Lakhs',
  processingFee: '1% - 1.5%',
  processingTime: '5-7 Days',
  features: ['Minimal documentation', 'Flexible repayment options', 'No collateral required'],
  website: 'https://www.incred.com',
  contactNumber: '1800 102 1212',
  email: 'care@incred.com',
  logoUrl: '/banks/incred.png',
  isPopular: false
};

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  console.log('Connected to DB. Creating BankPriority table...');

  try {
    // 1. Create BankPriority Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BankPriority" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "priority" INTEGER UNIQUE NOT NULL,
        "bankName" TEXT UNIQUE NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('BankPriority table created or already exists.');

    // 2. Clear and Seed Bank Priorities
    console.log('Seeding BankPriority configurations...');
    await client.query('DELETE FROM "BankPriority"');
    for (const p of priorities) {
      await client.query(
        `INSERT INTO "BankPriority" (priority, "bankName", status) VALUES ($1, $2, $3)`,
        [p.priority, p.bankName, p.status]
      );
      console.log(`Seeded bank priority: ${p.priority} -> ${p.bankName}`);
    }

    // 3. Ensure InCred is seeded in Bank table
    console.log('Checking if InCred exists in Bank table...');
    const checkRes = await client.query('SELECT id FROM "Bank" WHERE id = $1', [incredBank.id]);
    if (checkRes.rows.length === 0) {
      console.log('Seeding InCred profile...');
      const query = `
        INSERT INTO "Bank" (
          id, name, "shortName", country, type, "loanTypes", "educationLoan",
          "interestRateMin", "interestRateMax", "maxLoanAmount", "collateralRequired",
          "collateralFreeLimit", "processingFee", "processingTime", features,
          website, "contactNumber", email, "logoUrl", "isPopular", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      `;
      const params = [
        incredBank.id,
        incredBank.name,
        incredBank.shortName,
        incredBank.country,
        incredBank.type,
        incredBank.loanTypes,
        incredBank.educationLoan,
        incredBank.interestRateMin,
        incredBank.interestRateMax,
        incredBank.maxLoanAmount,
        incredBank.collateralRequired,
        incredBank.collateralFreeLimit,
        incredBank.processingFee,
        incredBank.processingTime,
        incredBank.features,
        incredBank.website,
        incredBank.contactNumber,
        incredBank.email,
        incredBank.logoUrl,
        incredBank.isPopular
      ];
      await client.query(query, params);
      console.log('InCred bank profile seeded successfully.');
    } else {
      console.log('InCred bank profile already exists.');
    }

    console.log('Database setup complete.');
  } catch (error) {
    console.error('Error during database configuration:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
