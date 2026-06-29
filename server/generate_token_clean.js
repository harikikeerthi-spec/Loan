const jwt = require('./node_modules/jsonwebtoken');

const payload = {
    email: "staff@vidyaloan.com",
    sub: "staff",
    role: "staff"
};

const secret = 'dev-secret-key-change-this-in-production-2024';
const token = jwt.sign(payload, secret, { expiresIn: '7d' });

const fs = require('fs');
fs.writeFileSync('admin_token_final_clean.txt', token);
console.log('Token written to admin_token_final_clean.txt');
