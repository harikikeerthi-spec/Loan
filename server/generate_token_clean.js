const jwt = require('./node_modules/jsonwebtoken');

const payload = {
    email: "harikikeerthi@gmail.com",
    sub: "1f3d3a39-331c-4b41-bc81-c313761e1702",
    role: "admin"
};

const secret = 'your-super-secret-jwt-key-change-this-in-production';
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

const fs = require('fs');
fs.writeFileSync('admin_token_final_clean.txt', token);
console.log('Token written to admin_token_final_clean.txt');
