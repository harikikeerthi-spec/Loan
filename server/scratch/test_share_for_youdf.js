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

const convId = '3600f2e0-b0c1-4418-a4e6-c25dbff8f5c5';
const postData = JSON.stringify({
    conversationId: convId,
    fileName: 'YoudfTestDocument.pdf',
    filePath: 'uploads/chat/3600f2e0-b0c1-4418-a4e6-c25dbff8f5c5/youdf_test.pdf',
    mimeType: 'application/pdf'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/share-document',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
    }
};

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

req.write(postData);
req.end();
