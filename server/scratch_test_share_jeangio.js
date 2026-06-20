const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const token = jwt.sign(
    {
        email: 'jimawa1376@afterdo.com',
        role: 'staff',
        firstName: 'Jean',
        lastName: 'Gio',
        phoneNumber: '8238423890',
        sub: 'VL-STU-2026-00005'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

async function testShare() {
    const convId = 'ad1097dd-ab70-42f1-a879-1cacbef1fa01';
    
    console.log('Sending request to /api/chat/share-document for conversation:', convId);

    const postData = JSON.stringify({
        conversationId: convId,
        fileName: 'TestDocument.pdf',
        filePath: 'uploads/chat/ad1097dd-ab70-42f1-a879-1cacbef1fa01/test.pdf',
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
        console.error('Problem with request:', e.message);
    });

    req.write(postData);
    req.end();
}

testShare().catch(console.error);
