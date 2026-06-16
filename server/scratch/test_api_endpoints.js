const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || 'secretKey';

async function testEndpointForUser(userDesc, email, firstName, role) {
    console.log(`\n--- Testing API for ${userDesc} (${email}) ---`);
    
    // Generate JWT token
    const payload = {
        email: email,
        sub: `TEST-${role.toUpperCase()}-${firstName}`,
        firstName: firstName,
        lastName: 'TESTER',
        phoneNumber: '1234567890',
        role: role
    };
    
    const token = jwt.sign(payload, secret);
    
    // 1. Fetch dashboard files
    const filesUrl = `http://localhost:${port}/api/bank/dashboard/files`;
    console.log(`GET ${filesUrl} ...`);
    const filesRes = await fetch(filesUrl, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-bank-id': userDesc === 'Avanse' ? 'avanse' : 'poonawalla'
        }
    });
    
    if (!filesRes.ok) {
        const text = await filesRes.text();
        throw new Error(`Failed to fetch dashboard files (Status: ${filesRes.status}): ${text}`);
    }
    
    const filesData = await filesRes.json();
    console.log(`Success! Fetched ${filesData.length} files from dashboard:`);
    console.log(filesData.map(f => ({ id: f.id, fileName: f.fileName, bankId: f.bankId })));

    // 2. Fetch admin stats for bank
    const statsUrl = `http://localhost:${port}/api/applications/admin/stats`;
    console.log(`GET ${statsUrl} ...`);
    const statsRes = await fetch(statsUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!statsRes.ok) {
        const text = await statsRes.text();
        throw new Error(`Failed to fetch admin stats (Status: ${statsRes.status}): ${text}`);
    }
    
    const statsData = await statsRes.json();
    console.log(`Success! Fetched stats for bank. Total Applications: ${statsData.data?.total || 0}`);

    // 3. Fetch portfolio analysis for bank
    const portfolioUrl = `http://localhost:${port}/api/admin/applications/portfolio/analysis`;
    console.log(`GET ${portfolioUrl} ...`);
    const portfolioRes = await fetch(portfolioUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!portfolioRes.ok) {
        const text = await portfolioRes.text();
        throw new Error(`Failed to fetch portfolio analysis (Status: ${portfolioRes.status}): ${text}`);
    }
    
    const portfolioData = await portfolioRes.json();
    console.log(`Success! Fetched portfolio. Total Portfolio Value: ₹${portfolioData.data?.totalPortfolioValue || 0}`);

    // 4. Fetch compliance report for bank
    const complianceUrl = `http://localhost:${port}/api/admin/applications/compliance/report`;
    console.log(`GET ${complianceUrl} ...`);
    const complianceRes = await fetch(complianceUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!complianceRes.ok) {
        const text = await complianceRes.text();
        throw new Error(`Failed to fetch compliance report (Status: ${complianceRes.status}): ${text}`);
    }
    
    const complianceData = await complianceRes.json();
    console.log(`Success! Fetched compliance report. Overall Compliance: ${complianceData.data?.overallCompliance || 0}%`);

    // 5. Fetch incoming files (TAT/Queue)
    const incomingUrl = `http://localhost:${port}/api/bank/incoming-files`;
    console.log(`GET ${incomingUrl} ...`);
    const incomingRes = await fetch(incomingUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!incomingRes.ok) {
        const text = await incomingRes.text();
        throw new Error(`Failed to fetch incoming files (Status: ${incomingRes.status}): ${text}`);
    }
    
    const incomingData = await incomingRes.json();
    console.log(`Success! Fetched ${incomingData.length} incoming queue files:`);
    console.log(incomingData.map(a => ({ id: a.id, bank: a.bank, status: a.status })));
}

async function runTests() {
    try {
        // Test Avanse user (ropayi2211@aspensif.com)
        await testEndpointForUser('Avanse', 'ropayi2211@aspensif.com', 'MADASU', 'bank');

        // Test Poonawalla user (farmatech@gmail.com)
        await testEndpointForUser('Poonawalla', 'farmatech@gmail.com', 'BAPAIAH NAIDU', 'bank');

        console.log('\n✅ All API endpoint verification checks passed successfully!');
    } catch (err) {
        console.error('\n❌ API verification test failed:', err);
        process.exit(1);
    }
}

runTests();
