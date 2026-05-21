const { Client } = require('pg');
require('dotenv').config();

const banks = [
  {
    id: 'auxilo',
    name: 'Auxilo Finserve',
    shortName: 'Auxilo',
    country: 'India',
    type: 'NBFC',
    loanTypes: ['education'],
    educationLoan: true,
    interestRateMin: 9.5,
    interestRateMax: 12.5,
    maxLoanAmount: '40 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '40 Lakhs',
    processingFee: '1% - 1.5%',
    processingTime: '5-7 Days',
    features: ['Customized loans', 'Multi-city co-applicants', 'Flexible collateral options'],
    website: 'https://www.auxilo.com',
    contactNumber: '+91 22 62463333',
    email: 'support@auxilo.com',
    logoUrl: '/banks/auxilo.png',
    isPopular: true
  },
  {
    id: 'avanse',
    name: 'Avanse Financial',
    shortName: 'Avanse',
    country: 'India',
    type: 'NBFC',
    loanTypes: ['education'],
    educationLoan: true,
    interestRateMin: 10.0,
    interestRateMax: 13.0,
    maxLoanAmount: '50 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '45 Lakhs',
    processingFee: '1% - 2%',
    processingTime: '4-6 Days',
    features: ['100% funding', 'Fast sanction', 'No upper limit on loan amount'],
    website: 'https://www.avanse.com',
    contactNumber: '1800 222 301',
    email: 'customercare@avanse.com',
    logoUrl: '/banks/avanse.png',
    isPopular: true
  },
  {
    id: 'credila',
    name: 'HDFC Credila',
    shortName: 'Credila',
    country: 'India',
    type: 'NBFC',
    loanTypes: ['education'],
    educationLoan: true,
    interestRateMin: 8.5,
    interestRateMax: 11.5,
    maxLoanAmount: '1.5 Crore',
    collateralRequired: false,
    collateralFreeLimit: '75 Lakhs',
    processingFee: '1%',
    processingTime: '3-5 Days',
    features: ['Tax benefits under Sec 80E', 'HDFC Trust', 'No upper limit on loan amount'],
    website: 'https://www.hdfccredila.com',
    contactNumber: '1800 209 3636',
    email: 'loan@hdfccredila.com',
    logoUrl: '/banks/credila.png',
    isPopular: true
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC',
    country: 'India',
    type: 'Private Bank',
    loanTypes: ['education', 'home', 'personal'],
    educationLoan: true,
    interestRateMin: 9.0,
    interestRateMax: 12.0,
    maxLoanAmount: '75 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '50 Lakhs',
    processingFee: '1%',
    processingTime: '5-7 Days',
    features: ['Paperless application', 'Attractive interest rates', 'Multi-city co-applicant permitted'],
    website: 'https://www.idfcfirstbank.com',
    contactNumber: '1800 10 888',
    email: 'banker@idfcfirstbank.com',
    logoUrl: '/banks/idfc.png',
    isPopular: true
  },
  {
    id: 'poonawalla',
    name: 'Poonawalla Fincorp',
    shortName: 'Poonawalla',
    country: 'India',
    type: 'NBFC',
    loanTypes: ['education', 'personal'],
    educationLoan: true,
    interestRateMin: 9.75,
    interestRateMax: 12.5,
    maxLoanAmount: '30 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '30 Lakhs',
    processingFee: '1%',
    processingTime: '3-5 Days',
    features: ['Attractive interest rates', 'No hidden charges', 'Minimal documentation'],
    website: 'https://poonawallafincorp.com',
    contactNumber: '1800 266 3201',
    email: 'info@poonawallafincorp.com',
    logoUrl: '/banks/poonawalla.jpg',
    isPopular: false
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    country: 'India',
    type: 'Public Bank',
    loanTypes: ['education', 'home', 'personal'],
    educationLoan: true,
    interestRateMin: 8.2,
    interestRateMax: 10.5,
    maxLoanAmount: '1.5 Crore',
    collateralRequired: true,
    collateralFreeLimit: '7.5 Lakhs',
    processingFee: '0 - 10,000 INR',
    processingTime: '10-15 Days',
    features: ['Lowest interest rates', 'No prepayment penalty', 'Government subsidy scheme (CSIS) available'],
    website: 'https://sbi.co.in',
    contactNumber: '1800 11 2211',
    email: 'contactcentre@sbi.co.in',
    logoUrl: '/banks/sbi.png',
    isPopular: true
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    country: 'India',
    type: 'Private Bank',
    loanTypes: ['education', 'home', 'personal'],
    educationLoan: true,
    interestRateMin: 9.25,
    interestRateMax: 11.75,
    maxLoanAmount: '1 Crore',
    collateralRequired: false,
    collateralFreeLimit: '40 Lakhs',
    processingFee: '1%',
    processingTime: '5-7 Days',
    features: ['Pre-approved loan options', 'Quick digital sanction', 'Tax benefits under Sec 80E'],
    website: 'https://www.icicibank.com',
    contactNumber: '1800 200 3344',
    email: 'customer.care@icicibank.com',
    logoUrl: '/banks/icici.png',
    isPopular: false
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    country: 'India',
    type: 'Private Bank',
    loanTypes: ['education', 'home', 'personal'],
    educationLoan: true,
    interestRateMin: 9.5,
    interestRateMax: 12.0,
    maxLoanAmount: '75 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '40 Lakhs',
    processingFee: '1%',
    processingTime: '5-7 Days',
    features: ['Fast-track processing', 'Tax benefits under Section 80E', 'Co-applicant flexibility'],
    website: 'https://www.axisbank.com',
    contactNumber: '1800 419 5959',
    email: 'loans@axisbank.com',
    logoUrl: '/banks/axis.png',
    isPopular: false
  }
];

async function seed() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  console.log('Clearing existing Bank profiles if any...');
  await client.query('DELETE FROM "Bank"');

  console.log('Seeding Bank profiles...');
  for (const bank of banks) {
    const query = `
      INSERT INTO "Bank" (
        id, name, "shortName", country, type, "loanTypes", "educationLoan",
        "interestRateMin", "interestRateMax", "maxLoanAmount", "collateralRequired",
        "collateralFreeLimit", "processingFee", "processingTime", features,
        website, "contactNumber", email, "logoUrl", "isPopular", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
    `;
    const params = [
      bank.id,
      bank.name,
      bank.shortName,
      bank.country,
      bank.type,
      bank.loanTypes,
      bank.educationLoan,
      bank.interestRateMin,
      bank.interestRateMax,
      bank.maxLoanAmount,
      bank.collateralRequired,
      bank.collateralFreeLimit,
      bank.processingFee,
      bank.processingTime,
      bank.features,
      bank.website,
      bank.contactNumber,
      bank.email,
      bank.logoUrl,
      bank.isPopular
    ];
    await client.query(query, params);
    console.log(`Seeded bank: ${bank.name}`);
  }

  console.log('Seeding complete!');
  await client.end();
}

seed().catch(console.error);
