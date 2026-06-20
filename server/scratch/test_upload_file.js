const http = require('http');
const fs = require('fs');
const path = require('path');

// A simple implementation of multipart/form-data request in pure Node.js
function uploadFile() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcmlraWtlZXJ0aGlAZ21haWwuY29tIiwic3ViIjoiMWYzZDNhMzktMzMxYy00YjQxLWJjODEtYzMxMzc2MWUxNzAyIiwiZmlyc3ROYW1lIjoiSGFyaSIsImxhc3ROYW1lIjoiSyIsInBob25lTnVtYmVyIjoiOTg3NjU0MzIxMCIsInJvbGUiOiJzdGFmZiIsImlhdCI6MTc4MTk0MDgyNSwiZXhwIjoxNzgyNTQ1NjI1fQ.9z-ZS3ht5zvg-b0zDdOloEjeMaKpaVJyvqmVJK8rhOw';
    const conversationId = '86ba6d7d-e862-4b0b-81e1-ff9c768476c1';
    
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = 'dummy.pdf';
    const fileContent = Buffer.from('%PDF-1.4 ... dummy pdf content ...');
    const mimeType = 'application/pdf';

    let payload = Buffer.concat([
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
            'Content-Length': payload.length,
            'Authorization': `Bearer ${token}`
        }
    };

    console.log('Sending upload request to /api/chat/upload...');
    const req = http.request(options, (res) => {
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Body:', body);
        });
    });

    req.on('error', (e) => {
        console.error('Request error:', e);
    });

    req.write(payload);
    req.end();
}

uploadFile();
