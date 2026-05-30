const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';

const payload = {
  email: 'harikikeerthi@gmail.com',
  sub: '1f3d3a39-331c-4b41-bc81-c313761e1702', // sub doesn't matter too much as long as findOne(email) matches
  firstName: 'Hari',
  lastName: 'K',
  phoneNumber: '9876543210',
  role: 'staff'
};

const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log('Generated JWT Token for harikikeerthi@gmail.com (role: staff):\n');
console.log(token);
