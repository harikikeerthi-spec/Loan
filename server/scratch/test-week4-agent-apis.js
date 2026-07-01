const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();


async function main() {
  console.log('=== WEEK 4 AGENT PORTAL API INTEGRATION TEST ===');
  
  // 1. Load Token and decode email
  const tokenFile = path.join(__dirname, '..', 'admin_token_final_clean.txt');
  if (!fs.existsSync(tokenFile)) {
    throw new Error(`Token file not found at ${tokenFile}`);
  }
  const token = fs.readFileSync(tokenFile, 'utf8').trim();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const payloadSegment = token.split('.')[1];
  const payload = JSON.parse(Buffer.from(payloadSegment, 'base64').toString('utf8'));
  const email = payload.email;
  console.log(`Token User Email: ${email}`);

  // 2. Connect to database using pg to retrieve user ID and map some referrals if needed
  const pgClient = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
  });
  await pgClient.connect();
  console.log('✓ Connected to active database');

  // Get user ID
  const userRes = await pgClient.query('SELECT id FROM "User" WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    throw new Error(`User with email ${email} not found in database`);
  }
  const agentId = userRes.rows[0].id;
  console.log(`Agent User ID: ${agentId}`);

  // Ensure there are referrals mapped to this agent so that the analytics endpoints return real data
  const refCountRes = await pgClient.query('SELECT COUNT(*) FROM "Referral" WHERE "referrerId" = $1', [agentId]);
  const referralCount = parseInt(refCountRes.rows[0].count);
  console.log(`Existing referrals for agent: ${referralCount}`);

  if (referralCount === 0) {
    console.log('Agent has no referrals. Mapping existing applications/students to this agent...');
    // Find some existing applications
    const appsRes = await pgClient.query('SELECT "userId", email FROM "LoanApplication" LIMIT 5');
    for (const app of appsRes.rows) {
      if (app.userId) {
        const crypto = require('crypto');
        const refId = crypto.randomUUID();
        await pgClient.query(
          `INSERT INTO "Referral" ("id", "referrerId", "refereeId", "refereeEmail", "status", "createdAt")
           VALUES ($1, $2, $3, $4, 'signed_up', NOW())
           ON CONFLICT DO NOTHING`,
          [refId, agentId, app.userId, app.email || 'referee@example.com']
        );
      }
    }
    console.log('✓ Referral mapping seeded successfully.');
  }

  // Get a valid referee application ID for tracking link test
  const refereeRes = await pgClient.query(
    `SELECT a.id, a."applicationNumber" 
     FROM "LoanApplication" a 
     JOIN "Referral" r ON a."userId" = r."refereeId" 
     WHERE r."referrerId" = $1 LIMIT 1`,
    [agentId]
  );
  let testLeadId = null;
  if (refereeRes.rows.length > 0) {
    testLeadId = refereeRes.rows[0].id;
    console.log(`Using Lead ID for tracking: ${testLeadId} (${refereeRes.rows[0].applicationNumber})`);
  }

  await pgClient.end();
  console.log('✓ DB setup complete. Disconnected from DB.');

  // 3. Perform HTTP requests to verify new endpoints
  const baseUrl = 'http://localhost:5000/api';
  let trackingToken = null;
  let testSubAgentId = null;
  let testAlumniId = null;
  let testTaskId = null;

  const testCases = [
    {
      name: 'GET Analytics Funnel',
      url: `${baseUrl}/analytics/funnel`,
      method: 'GET'
    },
    {
      name: 'GET Analytics Trend',
      url: `${baseUrl}/analytics/trend`,
      method: 'GET'
    },
    {
      name: 'GET Analytics Rejections',
      url: `${baseUrl}/analytics/rejections`,
      method: 'GET'
    },
    {
      name: 'GET Analytics Leaderboard',
      url: `${baseUrl}/analytics/leaderboard`,
      method: 'GET'
    },
    {
      name: 'GET Tasks',
      url: `${baseUrl}/tasks`,
      method: 'GET',
      after: (body) => {
        if (body.data && body.data.length > 0) {
          testTaskId = body.data[0].id;
        }
      }
    },
    {
      name: 'GET Sub-Agents list',
      url: `${baseUrl}/sub-agents`,
      method: 'GET',
      after: (body) => {
        if (body.data && body.data.length > 0) {
          testSubAgentId = body.data[0].id;
        }
      }
    },
    {
      name: 'POST Invite Sub-Agent',
      url: `${baseUrl}/sub-agents/invite`,
      method: 'POST',
      body: { name: 'Ravi Verma', email: 'ravi.verma@example.com', phone: '9900990099' }
    },
    {
      name: 'GET Training Modules',
      url: `${baseUrl}/training/modules`,
      method: 'GET'
    },
    {
      name: 'POST Complete Training Module',
      url: `${baseUrl}/training/modules/mod-1/complete`,
      method: 'POST'
    },
    {
      name: 'GET Training Resources',
      url: `${baseUrl}/training/resources`,
      method: 'GET'
    },
    {
      name: 'GET QR Code My-Code',
      url: `${baseUrl}/qr/my-code`,
      method: 'GET'
    },
    {
      name: 'GET QR Scan Analytics',
      url: `${baseUrl}/qr/scan-analytics`,
      method: 'GET'
    },
    {
      name: 'GET BT Leads',
      url: `${baseUrl}/bt-leads`,
      method: 'GET'
    },
    {
      name: 'GET Alumni list',
      url: `${baseUrl}/alumni`,
      method: 'GET',
      after: (body) => {
        if (body.data && body.data.length > 0) {
          testAlumniId = body.data[0].id;
        }
      }
    },
    {
      name: 'GET Referrals Analytics',
      url: `${baseUrl}/referrals/analytics`,
      method: 'GET'
    }
  ];

  // Dynamic / parameters test cases will be run after their dependencies are loaded
  for (const tc of testCases) {
    console.log(`\nTesting ${tc.name}: [${tc.method}] ${tc.url}...`);
    try {
      const options = {
        method: tc.method,
        headers
      };
      if (tc.body) {
        options.body = JSON.stringify(tc.body);
      }
      const res = await fetch(tc.url, options);
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        if (tc.after) tc.after(body);
        console.log('Preview:', JSON.stringify(body).slice(0, 180) + '...');
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error(`Error during ${tc.name}:`, e.message);
    }
  }

  // Dependent tests
  if (testLeadId) {
    console.log(`\nTesting GET Leads Tracking Link on Lead ID: ${testLeadId}...`);
    try {
      const url = `${baseUrl}/leads/${testLeadId}/tracking-link`;
      const res = await fetch(url, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        trackingToken = body.data?.token;
        console.log('Tracking Link Data:', body.data);
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error('Error testing Leads Tracking Link:', e.message);
    }
  }

  if (trackingToken) {
    console.log(`\nTesting PUBLIC GET Tracking Status on Token: ${trackingToken}...`);
    try {
      const url = `${baseUrl}/tracking-links/${trackingToken}`;
      // Note: PUBLIC - no authorization headers
      const res = await fetch(url);
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        console.log('Public Data (Check PII masking):', body.data);
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error('Error testing Public Tracking Status:', e.message);
    }
  }

  if (testSubAgentId) {
    console.log(`\nTesting GET Sub-Agent Performance on ID: ${testSubAgentId}...`);
    try {
      const url = `${baseUrl}/sub-agents/${testSubAgentId}/performance`;
      const res = await fetch(url, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        console.log('Performance Details:', body.data);
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error('Error testing Sub-Agent Performance:', e.message);
    }
  }

  if (testAlumniId) {
    console.log(`\nTesting GET Alumni Referral Link on ID: ${testAlumniId}...`);
    try {
      const url = `${baseUrl}/alumni/${testAlumniId}/referral-link`;
      const res = await fetch(url, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        console.log('Referral Link Data:', body.data);
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error('Error testing Alumni Referral Link:', e.message);
    }
  }

  if (testTaskId) {
    console.log(`\nTesting GET Task by ID: ${testTaskId}...`);
    try {
      const url = `${baseUrl}/tasks/${testTaskId}`;
      const res = await fetch(url, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        console.log('Task Details:', body.data);
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error('Error testing Task by ID:', e.message);
    }
  }

  console.log('\n=== INTEGRATION TEST COMPLETED ===');
}

main().catch(console.error);
