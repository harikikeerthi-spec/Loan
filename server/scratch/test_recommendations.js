const fetch = require('node-fetch');
require('dotenv').config();

const port = process.env.PORT || 5000;

async function testEligibilityCheck() {
  const url = `http://localhost:${port}/api/ai/eligibility-check`;
  const body = {
    age: 22,
    credit: 750,
    income: 600000,
    loan: 2000000,
    employment: 'student',
    study: 'masters',
    coApplicant: 'yes',
    collateral: 'no',
    userId: null
  };

  console.log(`Sending POST request to ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Request failed (Status: ${res.status}):`, text);
      return;
    }

    const data = await res.json();
    console.log('\nResponse Success!\n');
    console.log('Eligibility score:', data.eligibility?.score);
    console.log('Eligibility status:', data.eligibility?.status);
    console.log('Eligibility rateRange:', data.eligibility?.rateRange);
    
    console.log('\n--- BEST FINANCIAL MATCH (PRIMARY OFFER) ---');
    console.log('Bank Name:', data.recommendations?.primary?.offer?.bank);
    console.log('Product Name:', data.recommendations?.primary?.offer?.name);
    console.log('Fit Score:', data.recommendations?.primary?.fit);
    console.log('APR:', data.recommendations?.primary?.offer?.apr);

    console.log('\n--- ALTERNATIVES ---');
    for (const alt of data.recommendations?.alternatives || []) {
      console.log('Alternative Bank:', alt.offer?.bank);
      console.log('Alternative Product:', alt.offer?.name);
      console.log('Alternative Fit Score:', alt.fit);
      console.log('Alternative APR:', alt.offer?.apr);
      console.log('---');
    }

    // Verify recommendations
    const partnerBanks = ['Avanse Financial', 'HDFC Credila', 'IDFC FIRST Bank', 'Auxilo Finserve', 'InCred'];
    const primaryBank = data.recommendations?.primary?.offer?.bank;
    const isPrimaryValid = partnerBanks.some(pb => primaryBank && primaryBank.toLowerCase().includes(pb.split(' ')[0].toLowerCase()));
    
    console.log('\nVerification:');
    if (isPrimaryValid) {
      console.log('✅ Success: Primary recommended bank is one of our partner banks!');
    } else {
      console.error('❌ Error: Recommended primary bank is NOT one of our partner banks!');
    }

  } catch (err) {
    console.error('Network Error:', err);
  }
}

testEligibilityCheck();
