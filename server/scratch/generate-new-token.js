const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const secret = 'dev-secret-key-change-this-in-production-2024';
const payload = {
  email: 'harikikeerthi@gmail.com',
  sub: '1f3d3a39-331c-4b41-bc81-c313761e1702',
  role: 'admin'
};

// Sign with 30 days expiration
const token = jwt.sign(payload, secret, { expiresIn: '30d' });

const tokenPath = path.join(__dirname, '..', 'admin_token_final_clean.txt');
fs.writeFileSync(tokenPath, token, 'utf8');

console.log('✅ Generated new admin JWT token successfully!');
console.log('Saved to:', tokenPath);
console.log('Payload:', payload);
console.log('Token preview:', token.slice(0, 30) + '...');
