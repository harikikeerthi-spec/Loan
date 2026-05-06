const jwt = require('./node_modules/jsonwebtoken');

const payload = {
    email: "harikikeerthi@gmail.com",
    sub: "1f3d3a39-331c-4b41-bc81-c313761e1702",
    role: "admin"
};

const secret = 'your-super-secret-jwt-key-change-this-in-production';
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

// Print in chunks of 50 chars to avoid truncation issues
for (let i = 0; i < token.length; i += 50) {
    console.log(token.substring(i, i + 50));
}
