const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const banksToSeed = [
    {
        name: "IDFC First Bank",
        shortName: "idfc",
        country: "India",
        type: "Private",
        loanTypes: ["Education Loan"],
        educationLoan: true,
        interestRateMin: 10.25,
        interestRateMax: 14.5,
        maxLoanAmount: "₹40 Lakhs",
        collateralRequired: false,
        collateralFreeLimit: "₹40 Lakhs",
        processingFee: "1% + GST",
        processingTime: "48 hours",
        features: [
            "Competitive Rates: Starting at 10.25% p.a. with flexible tenure options",
            "High Loan Amount: Up to ₹40 lakhs without collateral",
            "Quick Processing: Sanction letter in as quick as 48 hours",
            "Flexible Repayment: Moratorium period during course + 1 year"
        ],
        website: "https://idfcfirstbank.com",
        logoUrl: "/banks/idfc.png",
        isPopular: true
    },
    {
        name: "Auxilo",
        shortName: "auxilo",
        country: "India",
        type: "NBFC",
        loanTypes: ["Education Loan"],
        educationLoan: true,
        interestRateMin: 10.25,
        interestRateMax: 14.5,
        maxLoanAmount: "No Limit",
        collateralRequired: false,
        collateralFreeLimit: "₹50 Lakhs",
        processingFee: "1% + GST",
        processingTime: "48 hours",
        features: [
            "100% Financing: Covering tuition, living, travel and even laptop costs",
            "Customized Loans: Tailored to your specific course and financial needs",
            "Fast Disbursement: Quick fund transfer once sanction letter is issued",
            "Global Coverage: Support for 900+ global universities across 20 countries"
        ],
        website: "https://auxilo.com",
        logoUrl: "/banks/auxilo.png",
        isPopular: true
    },
    {
        name: "Avanse Financial",
        shortName: "avanse",
        country: "India",
        type: "NBFC",
        loanTypes: ["Education Loan"],
        educationLoan: true,
        interestRateMin: 10.25,
        interestRateMax: 14.5,
        maxLoanAmount: "No Limit",
        collateralRequired: false,
        collateralFreeLimit: "₹50 Lakhs",
        processingFee: "1% + GST",
        processingTime: "48 hours",
        features: [
            "Fast Sanctions: Get conditional approval in just 3 working days",
            "100% Funding: Covers tuition fees, living costs, and travel expenses",
            "Pre-Admission Letter: Sanction letters available prior to final admission",
            "Tailored Repayments: Customized grace periods and interest options"
        ],
        website: "https://avanse.com",
        logoUrl: "/banks/avanse.png",
        isPopular: true
    },
    {
        name: "HDFC Credila",
        shortName: "credila",
        country: "India",
        type: "NBFC",
        loanTypes: ["Education Loan"],
        educationLoan: true,
        interestRateMin: 10.25,
        interestRateMax: 14.5,
        maxLoanAmount: "No Limit",
        collateralRequired: false,
        collateralFreeLimit: "₹50 Lakhs",
        processingFee: "1% + GST",
        processingTime: "48 hours",
        features: [
            "Dedicated Specialist: Specialized team dealing only with education loans",
            "No Upper Limit: Higher loan amounts sanctioned based on profile",
            "Tax Benefits: Tax deduction benefits under Section 80E of Income Tax Act",
            "Flexible Repayment: Up to 15 years loan tenure with flexible EMI options"
        ],
        website: "https://hdfccredila.com",
        logoUrl: "/banks/credila.png",
        isPopular: true
    },
    {
        name: "Poonawalla Fincorp",
        shortName: "poonawalla",
        country: "India",
        type: "NBFC",
        loanTypes: ["Education Loan"],
        educationLoan: true,
        interestRateMin: 10.25,
        interestRateMax: 14.5,
        maxLoanAmount: "₹50 Lakhs",
        collateralRequired: false,
        collateralFreeLimit: "₹50 Lakhs",
        processingFee: "1% + GST",
        processingTime: "48 hours",
        features: [
            "Paperless Process: 100% digital journey from application to approval",
            "Attractive Rates: Flexible rates based on candidate profile",
            "Minimal Documents: Requires only essential KYC and academic proofs",
            "Flexible Tenure: Repayment structures that align with post-study income"
        ],
        website: "https://poonawallafincorp.com",
        logoUrl: "/banks/poonawalla.jpg",
        isPopular: true
    }
];

async function seed() {
    console.log("Upserting default bank partners with timestamps...");
    const now = new Date().toISOString();
    for (const bank of banksToSeed) {
        // Upsert by shortName
        const { data: existing } = await supabase
            .from('Bank')
            .select('id')
            .eq('shortName', bank.shortName)
            .maybeSingle();

        if (existing) {
            console.log(`Updating ${bank.name}...`);
            const updatePayload = {
                ...bank,
                updatedAt: now
            };
            const { error } = await supabase
                .from('Bank')
                .update(updatePayload)
                .eq('id', existing.id);
            if (error) console.error(`Error updating ${bank.name}:`, error);
        } else {
            console.log(`Inserting ${bank.name}...`);
            const bankWithId = {
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now,
                ...bank
            };
            const { error } = await supabase
                .from('Bank')
                .insert([bankWithId]);
            if (error) console.error(`Error inserting ${bank.name}:`, error);
        }
    }
    console.log("Seeding complete.");
}

seed().catch(err => {
    console.error("Seeding error:", err);
});
