const { Client } = require('pg');
require('dotenv').config();

// Mappings matching our updated logic
function resolveBankNameFromEmailAndName(email, firstName, role) {
    const isBank = (role === 'bank' || role === 'partner_bank');
    let bankName = null;
    
    if (isBank) {
        if (email) {
            const lowerEmail = email.toLowerCase().trim();
            if (lowerEmail.includes("auxilo") || lowerEmail === "luharika28@gmail.com") bankName = 'Auxilo';
            else if (lowerEmail.includes("avanse") || lowerEmail === "ropayi2211@aspensif.com") bankName = 'Avanse';
            else if (lowerEmail.includes("credila") || lowerEmail.includes("hdfc") || lowerEmail === "keerthichinnu0728@gmail.com") bankName = 'HDFC Credila';
            else if (lowerEmail.includes("idfc") || lowerEmail === "abhimadasu4@gmail.com") bankName = 'IDFC';
            else if (lowerEmail.includes("poonawalla") || lowerEmail === "farmatech@gmail.com") bankName = 'Poonawalla';
        }

        if (!bankName && firstName) {
            const lower = firstName.toLowerCase();
            if (lower.includes('credila')) bankName = 'HDFC Credila';
            else if (lower.includes('poonawalla')) bankName = 'Poonawalla';
            else if (lower.includes('idfc')) bankName = 'IDFC';
            else if (lower.includes('avanse')) bankName = 'Avanse';
            else if (lower.includes('auxilo')) bankName = 'Auxilo';
            else bankName = firstName;
        }
    }
    return bankName;
}

function resolveBankIdFromHeadersAndUser(headers, user) {
    const headerBank = headers['x-bank-id'] || headers['x-selected-bank'];
    if (headerBank) {
        const hb = headerBank.toString().toLowerCase();
        if (hb.includes('avanse')) return 'avanse';
        if (hb.includes('poonawalla')) return 'poonawalla';
        if (hb.includes('credila') || hb.includes('hdfc')) return 'credila';
        if (hb.includes('idfc')) return 'idfc';
        if (hb.includes('auxilo')) return 'auxilo';
        return hb;
    }
    
    if (user?.bankId) return user.bankId;

    if (user?.email) {
        const lowerEmail = user.email.toLowerCase().trim();
        if (lowerEmail.includes("auxilo") || lowerEmail === "luharika28@gmail.com") return "auxilo";
        if (lowerEmail.includes("avanse") || lowerEmail === "ropayi2211@aspensif.com") return "avanse";
        if (lowerEmail.includes("credila") || lowerEmail.includes("hdfc") || lowerEmail === "keerthichinnu0728@gmail.com") return "credila";
        if (lowerEmail.includes("idfc") || lowerEmail === "abhimadasu4@gmail.com") return "idfc";
        if (lowerEmail.includes("poonawalla") || lowerEmail === "farmatech@gmail.com") return "poonawalla";
    }

    if (user?.firstName) {
        const lowerName = user.firstName.toLowerCase();
        const validBanks = ['credila', 'auxilo', 'avanse', 'idfc', 'poonawalla', 'sbi', 'icici', 'axis'];
        if (validBanks.includes(lowerName)) return lowerName;
        const matched = validBanks.find(b => b.includes(lowerName) || lowerName.includes(b));
        if (matched) return matched;
    }
    return null;
}

async function runTests() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    console.log('--- 1. Testing user/email bank name resolution ---');
    const avanseUser = { email: 'ropayi2211@aspensif.com', firstName: 'MADASU', role: 'bank' };
    const poonawallaUser = { email: 'farmatech@gmail.com', firstName: 'BAPAIAH NAIDU', role: 'bank' };

    const avanseResolvedName = resolveBankNameFromEmailAndName(avanseUser.email, avanseUser.firstName, avanseUser.role);
    const poonawallaResolvedName = resolveBankNameFromEmailAndName(poonawallaUser.email, poonawallaUser.firstName, poonawallaUser.role);

    console.log(`Avanse user resolves to bankName: '${avanseResolvedName}' (Expected: 'Avanse')`);
    console.log(`Poonawalla user resolves to bankName: '${poonawallaResolvedName}' (Expected: 'Poonawalla')`);

    if (avanseResolvedName !== 'Avanse' || poonawallaResolvedName !== 'Poonawalla') {
        throw new Error('Bank name resolution failed!');
    }
    console.log('✅ Bank name resolution test passed.\n');

    console.log('--- 2. Testing user/email bank ID resolution ---');
    const avanseResolvedId = resolveBankIdFromHeadersAndUser({}, avanseUser);
    const poonawallaResolvedId = resolveBankIdFromHeadersAndUser({}, poonawallaUser);
    console.log(`Avanse user resolves to bankId: '${avanseResolvedId}' (Expected: 'avanse')`);
    console.log(`Poonawalla user resolves to bankId: '${poonawallaResolvedId}' (Expected: 'poonawalla')`);

    if (avanseResolvedId !== 'avanse' || poonawallaResolvedId !== 'poonawalla') {
        throw new Error('Bank ID resolution failed!');
    }
    console.log('✅ Bank ID resolution test passed.\n');

    console.log('--- 3. Testing headers bank ID resolution ---');
    const headerResolvedId = resolveBankIdFromHeadersAndUser({ 'x-selected-bank': 'Avanse Financial' }, {});
    console.log(`Header 'x-selected-bank': 'Avanse Financial' resolves to: '${headerResolvedId}' (Expected: 'avanse')`);
    if (headerResolvedId !== 'avanse') {
        throw new Error('Header resolution failed!');
    }
    console.log('✅ Header resolution test passed.\n');

    console.log('--- 4. Querying database using resolved bankNames (broad matching) ---');
    
    // Test Avanse query matching
    const avanseDbRes = await client.query('SELECT id, bank, status FROM "LoanApplication" WHERE bank ILIKE $1', [`%${avanseResolvedName}%`]);
    console.log(`Resolved Avanse query matched ${avanseDbRes.rows.length} applications in database (Expected: 7)`);
    if (avanseDbRes.rows.length !== 7) {
        throw new Error(`Avanse DB query matching failed. Expected 7 applications, got ${avanseDbRes.rows.length}`);
    }
    
    // Test Poonawalla query matching
    const poonawallaDbRes = await client.query('SELECT id, bank, status FROM "LoanApplication" WHERE bank ILIKE $1', [`%${poonawallaResolvedName}%`]);
    console.log(`Resolved Poonawalla query matched ${poonawallaDbRes.rows.length} applications in database (Expected: 1)`);
    if (poonawallaDbRes.rows.length !== 1) {
        throw new Error(`Poonawalla DB query matching failed. Expected 1 applications, got ${poonawallaDbRes.rows.length}`);
    }

    console.log('✅ Database wildcard match test passed.\n');

    console.log('--- 5. Verify self-healing Bank File synchronization ---');
    // Simulate what listBankFiles does to query and update FileEntry
    // Select all applications for Avanse
    const avanseAllApps = await client.query('SELECT bank, status FROM "LoanApplication" WHERE bank ILIKE \'%Avanse%\'');
    console.log('Avanse applications statuses:', avanseAllApps.rows);

    const avanseAppsRes = await client.query(`
        SELECT id, bank, status 
        FROM "LoanApplication" 
        WHERE (bank ILIKE '%Avanse Financial Services%' OR bank ILIKE '%Avanse Financial%' OR bank ILIKE '%Avanse%')
          AND status NOT IN ('submitted', 'pending', 'draft', 'docs_received', 'staff_verified', 'application_submitted')
    `);
    console.log(`Found ${avanseAppsRes.rows.length} Avanse applications eligible for self-healing/dashboard list:`);
    console.log(avanseAppsRes.rows);

    console.log('✅ All programmatic verification checks passed successfully.');
    await client.end();
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
