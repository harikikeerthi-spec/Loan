const fs = require('fs');
const path = require('path');

async function testApis() {
  const token = fs.readFileSync(path.join(__dirname, '..', 'admin_token_final_clean.txt'), 'utf8').trim();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const baseUrl = 'http://localhost:5000';
  
  const endpoints = [
    { name: 'GET Notifications', url: `${baseUrl}/notifications` },
    { name: 'GET Today Dashboard Metrics (F29)', url: `${baseUrl}/staff-profiles/dashboard/today` },
    { name: 'GET Summary Analytics (F13)', url: `${baseUrl}/staff-profiles/dashboard/summary` },
    { name: 'GET Rejection Analytics (F14)', url: `${baseUrl}/staff-profiles/dashboard/rejections?period=30` },
    { name: 'GET SLA Tracker (F15)', url: `${baseUrl}/staff-profiles/dashboard/sla` },
    { name: 'GET Global Search (F30)', url: `${baseUrl}/staff-profiles/dashboard/search?q=VL` },
    { name: 'GET Deadline Calendar (F44)', url: `${baseUrl}/staff-profiles/dashboard/calendar` }
  ];

  console.log('--- Week 4 API Verification ---');
  for (const ep of endpoints) {
    try {
      console.log(`\nTesting: ${ep.name} (${ep.url})...`);
      const res = await fetch(ep.url, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        // print keys or small preview of the result
        if (body.data) {
          if (Array.isArray(body.data)) {
            console.log(`Items count: ${body.data.length}`);
            if (body.data.length > 0) {
              console.log('First Item Preview:', JSON.stringify(body.data[0]).slice(0, 150) + '...');
            }
          } else {
            console.log('Keys returned:', Object.keys(body.data));
            if (ep.name.includes('AI Underwriting')) {
              console.log('Score details:', body.data);
            }
          }
        } else {
          console.log('Keys returned:', Object.keys(body));
        }
      } else {
        console.error('Result: FAILED', body);
      }
    } catch (e) {
      console.error(`Error testing ${ep.name}:`, e.message);
    }
  }

  // Now, let's test the AI Prediction Score (F47/F48) for an actual application
  try {
    console.log('\nFetching application for AI Prediction Score test...');
    const appsRes = await fetch(`${baseUrl}/staff-profiles/dashboard/today`, { headers });
    const appsData = await appsRes.json();
    
    // Find any application ID to use
    let appId = null;
    const todayData = appsData.data || {};
    for (const category of Object.values(todayData)) {
      if (category.items && category.items.length > 0) {
        appId = category.items[0].id;
        break;
      }
    }

    if (!appId) {
      // Fallback: check general list
      console.log('No application found in today dashboard. Fetching general list...');
      const listRes = await fetch(`${baseUrl}/applications/admin/all?limit=5`, { headers });
      const listData = await listRes.json();
      if (listData.data && listData.data.length > 0) {
        appId = listData.data[0].id;
      }
    }

    if (appId) {
      const predictUrl = `${baseUrl}/staff-profiles/dashboard/predict/${appId}`;
      console.log(`Testing AI Prediction (F47/48) on App ID: ${appId} (${predictUrl})...`);
      const res = await fetch(predictUrl, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        console.log('Prediction Score Details:', JSON.stringify(body.data, null, 2));
      } else {
        console.error('Result: FAILED', body);
      }
    } else {
      console.log('Skipping AI prediction test: No application found in database.');
    }
  } catch (e) {
    console.error('Error in AI Prediction test:', e.message);
  }
}

testApis().catch(console.error);
