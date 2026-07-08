const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';
  const payload = {
    email: 'pkfc0406@gmail.com',
    sub: 'VL-STU-2026-00016',
    firstName: 'Agent',
    lastName: 'User',
    phoneNumber: '9876543210',
    role: 'agent'
  };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Origin': 'http://localhost:3000',
    'Referer': 'http://localhost:3000/agent/lead-submission',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const leadPayload = {
    firstName: "Test",
    lastName: "BrowserHeaders",
    email: "test.headers.99@example.com",
    phoneNumber: "9876543210",
    dob: "2000-01-01",
    city: "Hyderabad",
    state: "Telangana",
    loanType: "Abroad",
    courseName: "MS Computer Science",
    collegeName: "Stanford University",
    amount: 5000000
  };

  console.log('Sending request with browser headers to http://localhost:3000/api/leads...');
  try {
    const res = await fetch('http://localhost:3000/api/leads', {
      method: 'POST',
      headers,
      body: JSON.stringify(leadPayload)
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const data = await res.text();
    console.log('Response body:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
