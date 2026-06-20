const jwt = require('jsonwebtoken');
const http = require('http');
const fs = require('fs');

const envFile = fs.readFileSync('./server/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
});

const secret = env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';

const payload = {
  email: 'jimawa1376@afterdo.com',
  sub: 'VL-STU-2026-00005',
  role: 'staff'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('Generated token for Jean Gio');

const conversationId = '86ba6d7d-e862-4b0b-81e1-ff9c768476c1';
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const filename = 'staff_dummy.pdf';
const fileContent = Buffer.from('%PDF-1.4 ... dummy pdf content ...');
const mimeType = 'application/pdf';

let bodyPayload = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="conversationId"\r\n\r\n`),
    Buffer.from(`${conversationId}\r\n`),
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
    Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`)
]);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/upload',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyPayload.length,
        'Authorization': `Bearer ${token}`
    }
};

console.log('Sending upload request to /api/chat/upload for staff...');
const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(bodyPayload);
req.end();
