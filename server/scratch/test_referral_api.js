const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // node-fetch might not be installed, we can use built-in fetch if node version is >= 18
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';

// User 'VL-STU-2026-00044' / 'asdhherk234@gmail.com'
const payload = {
  sub: 'VL-STU-2026-00044',
  id: 'VL-STU-2026-00044',
  email: 'asdhherk234@gmail.com',
  role: 'user',
  firstName: 'wqedw',
  lastName: 'wr'
};

const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
console.log('Generated JWT Token:', token);

async function testFetch() {
  const urls = [
    'http://127.0.0.1:5000/api/referral/me',
    'http://localhost:5000/api/referral/me'
  ];

  for (const url of urls) {
    console.log(`\nFetching from URL: ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('Body:', text);
    } catch (err) {
      console.error('Fetch Error:', err.message);
    }
  }
}

testFetch();
