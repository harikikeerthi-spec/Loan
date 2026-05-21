const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';
const BASE_URL = 'http://localhost:5000/api';

// Helper to generate token
function generateToken(email, role) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '1h' });
}

// HTTP request helper
async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, options);
  const status = response.status;
  let json = null;
  try {
    json = await response.json();
  } catch (e) {
    // Not json
  }
  return { status, json };
}

async function runTests() {
  console.log('=== STARTING BANK PORTAL VALIDATION TESTS ===\n');

  // Connect to DB to find / prepare test data
  const pgClient = new Client({ connectionString: process.env.DIRECT_URL });
  await pgClient.connect();

  try {
    // 1. Fetch some application records for testing
    const appQuery = await pgClient.query(`
      SELECT id, bank, "lanNumber", status, "firstName", "lastName" 
      FROM "LoanApplication" 
      LIMIT 10
    `);
    const apps = appQuery.rows;
    console.log(`Found ${apps.length} applications in database for testing.`);

    if (apps.length === 0) {
      console.log('No applications in DB. Creating a mock application for testing...');
      // Let's insert a test application
      const mockId = `test-app-${Date.now()}`;
      const appNum = `APP-TEST-${Date.now()}`;
      await pgClient.query(`
        INSERT INTO "LoanApplication" (
          id, "userId", email, bank, "loanType", amount, status, stage, "firstName", "lastName", "submittedAt", "date", "updatedAt", "applicationNumber"
        ) VALUES (
          $1, '822ada98-5b94-44ec-a95f-1985fe1fa800', 'teststudent@example.com', 'IDFC FIRST Bank', 'education', 1500000, 'pending', 'file_logged', 'Test', 'Student', NOW(), NOW(), NOW(), $2
        )
      `, [mockId, appNum]);
      apps.push({
        id: mockId,
        bank: 'IDFC FIRST Bank',
        lanNumber: null,
        status: 'pending',
        firstName: 'Test',
        lastName: 'Student'
      });
    }

    // Identify applications by bank
    const idfcApp = apps.find(a => a.bank.toLowerCase().includes('idfc'));
    const hdfcApp = apps.find(a => a.bank.toLowerCase().includes('hdfc') || a.bank.toLowerCase().includes('credila'));

    console.log('\n--- Selected Test Applications ---');
    console.log('IDFC App:', idfcApp || 'None (Using first app)');
    console.log('HDFC App:', hdfcApp || 'None');

    const targetAppId = idfcApp ? idfcApp.id : apps[0].id;
    const targetAppBank = idfcApp ? 'idfc' : apps[0].bank.split(' ')[0].toLowerCase();
    
    // Generate Tokens
    const adminToken = generateToken('chinnu2341@gmail.com', 'admin');
    const staffToken = generateToken('staffvidhya@gmail.com', 'staff');
    const bankToken = generateToken('shannukalneedi@gmail.com', 'bank');

    console.log('\n--- Tokens Generated ---');
    console.log('Admin Token:', adminToken.substring(0, 20) + '...');
    console.log('Staff Token:', staffToken.substring(0, 20) + '...');
    console.log('Banker Token:', bankToken.substring(0, 20) + '...');

    // ==========================================
    // TEST 1: Role-Based Masking
    // ==========================================
    console.log('\n==========================================');
    console.log('TEST 1: Role-Based Masking Assertions');
    console.log('==========================================');

    // Make sure we have some mock data on disbursements / fees for checking masking
    // Let's upsert some mock fields for the targetAppId
    await pgClient.query('DELETE FROM "Disbursement" WHERE id = \'test-disb-1\'');
    await pgClient.query(`
      INSERT INTO "Disbursement" (id, "applicationId", "trancheNumber", amount, mode, "utrNumber", beneficiary, "disbursedAt", "confirmedBy")
      VALUES ('test-disb-1', $1, 1, 500000, 'NEFT', 'UTR12345TEST', 'Test Student', NOW(), 'shannukalneedi@gmail.com')
    `, [targetAppId]);

    const disbCheck = await pgClient.query('SELECT * FROM "Disbursement" WHERE "applicationId" = $1', [targetAppId]);
    console.log('Disbursement rows in DB for targetAppId:', disbCheck.rows);

    // Fetch details as Admin
    console.log('\n[Admin Request] Fetching details...');
    const adminRes = await makeRequest(`/bank/my-files/${targetAppId}`, 'GET', null, {
      'Authorization': `Bearer ${adminToken}`,
      'x-selected-bank': targetAppBank,
    });
    console.log(`Admin response status: ${adminRes.status}`);
    const adminData = adminRes.json?.data;
    if (adminData) {
      console.log('Admin sees disbursements:', Array.isArray(adminData.disbursements) && adminData.disbursements.length > 0 ? 'YES (Correct)' : 'NO (Failed)');
      console.log('Admin sees creditScore:', adminData.creditScore !== undefined ? 'YES (Correct)' : 'NO (Failed)');
      if (!Array.isArray(adminData.disbursements) || adminData.disbursements.length === 0) {
        console.log('Admin disbursements actual value:', adminData.disbursements);
      }
    }

    // Fetch details as Staff
    console.log('\n[Staff Request] Fetching details...');
    const staffRes = await makeRequest(`/bank/my-files/${targetAppId}`, 'GET', null, {
      'Authorization': `Bearer ${staffToken}`,
      'x-selected-bank': targetAppBank,
    });
    console.log(`Staff response status: ${staffRes.status}`);
    const staffData = staffRes.json?.data;
    if (staffData) {
      const staffMaskedKeys = ['disbursements', 'utrNumber', 'agentCommission', 'referralFee', 'creditScore', 'fileLoggedAt', 'sanctionConditionsInternal'];
      const failedKeys = staffMaskedKeys.filter(k => staffData[k] !== undefined);
      if (failedKeys.length === 0) {
        console.log('✅ Success: All staff fields masked properly:', staffMaskedKeys);
      } else {
        console.error('❌ Failure: Staff fields NOT masked:', failedKeys);
      }
    }

    // Fetch details as Banker
    console.log('\n[Banker Request] Fetching details...');
    const bankRes = await makeRequest(`/bank/my-files/${targetAppId}`, 'GET', null, {
      'Authorization': `Bearer ${bankToken}`,
      'x-selected-bank': targetAppBank,
    });
    console.log(`Banker response status: ${bankRes.status}`);
    const bankData = bankRes.json?.data;
    if (bankData) {
      const bankMaskedKeys = ['disbursements', 'agentCommission', 'referralFee', 'staffMetrics', 'revenueData'];
      const failedKeys = bankMaskedKeys.filter(k => bankData[k] !== undefined);
      if (failedKeys.length === 0) {
        console.log('✅ Success: All banker fields masked properly:', bankMaskedKeys);
      } else {
        console.error('❌ Failure: Banker fields NOT masked:', failedKeys);
      }
    }

    // ==========================================
    // TEST 2: Bank Data Isolation
    // ==========================================
    console.log('\n==========================================');
    console.log('TEST 2: Bank Data Isolation Assertions');
    console.log('==========================================');

    if (hdfcApp) {
      console.log(`[Banker IDFC Request] Attempting to access HDFC application ID ${hdfcApp.id}...`);
      const isolatedRes = await makeRequest(`/bank/my-files/${hdfcApp.id}`, 'GET', null, {
        'Authorization': `Bearer ${bankToken}`,
        'x-selected-bank': 'idfc', // banker selected bank is IDFC
      });
      console.log(`Isolation response status: ${isolatedRes.status} (Expected: 400 or 403)`);
      if (isolatedRes.status === 400 || isolatedRes.status === 403 || isolatedRes.status === 404) {
        console.log('✅ Success: Access denied to foreign bank data.');
      } else {
        console.error('❌ Failure: Access granted to foreign bank data!');
      }
    } else {
      console.log('Skipping foreign bank isolation check (No HDFC application found in DB).');
    }

    // ==========================================
    // TEST 3: State Updates & Flow Tests
    // ==========================================
    console.log('\n==========================================');
    console.log('TEST 3: State Updates & API Actions');
    console.log('==========================================');

    // Create a new application specifically for action flow testing
    const actionAppId = `action-app-${Date.now()}`;
    const actionAppNum = `APP-ACT-${Date.now()}`;
    await pgClient.query(`
      INSERT INTO "LoanApplication" (
        id, "userId", email, bank, "loanType", amount, status, stage, "firstName", "lastName", "submittedAt", "date", "updatedAt", "applicationNumber"
      ) VALUES (
        $1, '822ada98-5b94-44ec-a95f-1985fe1fa800', 'teststudent@example.com', 'IDFC FIRST Bank', 'education', 2000000, 'pending', 'submitted', 'Action', 'Student', NOW(), NOW(), NOW(), $2
      )
    `, [actionAppId, actionAppNum]);

    console.log(`Created action app ID: ${actionAppId}`);

    // A. Log File (Enter LAN)
    const lanNum = `LAN-TEST-${Date.now()}`;
    console.log(`\n[Action A] Logging File with LAN: ${lanNum}`);
    const logRes = await makeRequest(`/bank/applications/${actionAppId}/log-file`, 'POST', {
      lanNumber: lanNum,
    }, {
      'Authorization': `Bearer ${bankToken}`,
      'x-selected-bank': 'idfc',
    });
    console.log(`Log File status: ${logRes.status}`, logRes.json);

    // Verify LAN is logged in DB
    const lanCheck = await pgClient.query('SELECT "lanNumber", status FROM "LoanApplication" WHERE id = $1', [actionAppId]);
    console.log('DB values after logging LAN:', lanCheck.rows[0]);

    // B. Submit Decision (Sanctioned)
    console.log(`\n[Action B] Recording Sanction Decision`);
    const decisionRes = await makeRequest(`/bank/applications/${actionAppId}/decision`, 'POST', {
      decision: 'SANCTIONED',
      sanctionAmount: 1800000,
      interestRate: 9.75,
      roiType: 'floating',
      roiBase: 9.0,
      roiSubsidy: 0.25,
      roiEffective: 9.75,
      processingFee: 15000,
      sanctionExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      sanctionLetterUrl: '/docs/mock-sanction.pdf'
    }, {
      'Authorization': `Bearer ${bankToken}`,
      'x-selected-bank': 'idfc',
    });
    console.log(`Submit Decision status: ${decisionRes.status}`, decisionRes.json);

    // Verify Status is approved in DB
    const statusCheck = await pgClient.query('SELECT status FROM "LoanApplication" WHERE id = $1', [actionAppId]);
    console.log('DB status after sanction decision:', statusCheck.rows[0]);

    // C. Raise Query
    console.log(`\n[Action C] Raising Query`);
    const queryRes = await makeRequest(`/bank/applications/${actionAppId}/query`, 'POST', {
      queryType: 'DOCUMENT',
      description: 'Please upload co-applicant IT Returns for assessment.',
      requiredDocs: ['Co-Applicant Income Tax Return']
    }, {
      'Authorization': `Bearer ${bankToken}`,
      'x-selected-bank': 'idfc',
    });
    console.log(`Raise Query status: ${queryRes.status}`, queryRes.json);

    // D. Confirm Disbursement
    console.log(`\n[Action D] Confirming Disbursement Payout`);
    const disbRes = await makeRequest(`/bank/applications/${actionAppId}/disbursement`, 'POST', {
      trancheNumber: 1,
      amount: 600000,
      mode: 'NEFT',
      utrNumber: `UTR-NEFT-${Date.now()}`,
      beneficiary: 'Action Student',
      nextTrancheDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      remainingSanction: 1200000
    }, {
      'Authorization': `Bearer ${bankToken}`,
      'x-selected-bank': 'idfc',
    });
    console.log(`Confirm Disbursement status: ${disbRes.status}`, disbRes.json);

    // Clean up test action application
    console.log('\nCleaning up action test records...');
    await pgClient.query('DELETE FROM "Disbursement" WHERE "applicationId" = $1', [actionAppId]);
    await pgClient.query('DELETE FROM "BankQuery" WHERE "applicationId" = $1', [actionAppId]);
    await pgClient.query('DELETE FROM "BankDecision" WHERE "applicationId" = $1', [actionAppId]);
    await pgClient.query('DELETE FROM "LoanApplication" WHERE id = $1', [actionAppId]);
    console.log('Clean up done.');

  } catch (error) {
    console.error('Test runner encountered an error:', error);
  } finally {
    await pgClient.end();
    console.log('\n=== VALIDATION TESTS COMPLETE ===');
  }
}

runTests();
