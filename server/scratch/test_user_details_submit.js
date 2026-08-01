require('dotenv').config();
const http = require('http');

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testSubmit() {
  console.log('--- TESTING /api/auth/update-details SUBMISSION ---');

  const testEmail = 'chinnu2341@gmail.com';

  // 1. Submit user details
  const updateRes = await postJson('/api/auth/update-details', {
    email: testEmail,
    firstName: 'Chinnu',
    lastName: 'Kumar',
    phoneNumber: '9876543210',
    dateOfBirth: '15-08-1998'
  });

  console.log('Update Details API Response:', JSON.stringify(updateRes, null, 2));

  // 2. Fetch dashboard profile
  const dashRes = await postJson('/api/auth/dashboard', {
    email: testEmail
  });

  console.log('Dashboard API Response:', JSON.stringify(dashRes, null, 2));
}

testSubmit().catch(console.error);
