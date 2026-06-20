const http = require('http');

async function testShare() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcmlraWtlZXJ0aGlAZ21haWwuY29tIiwic3ViIjoiMWYzZDNhMzktMzMxYy00YjQxLWJjODEtYzMxMzc2MWUxNzAyIiwiZmlyc3ROYW1lIjoiSGFyaSIsImxhc3ROYW1lIjoiSyIsInBob25lTnVtYmVyIjoiOTg3NjU0MzIxMCIsInJvbGUiOiJzdGFmZiIsImlhdCI6MTc4MTk0MDgyNSwiZXhwIjoxNzgyNTQ1NjI1fQ.9z-ZS3ht5zvg-b0zDdOloEjeMaKpaVJyvqmVJK8rhOw';
    const convId = '86ba6d7d-e862-4b0b-81e1-ff9c768476c1';
    
    console.log('Sending request to /api/chat/share-document for conversation:', convId);

    const postData = JSON.stringify({
        conversationId: convId,
        fileName: 'TestDocument.pdf',
        filePath: 'uploads/chat/86ba6d7d-e862-4b0b-81e1-ff9c768476c1/test.pdf',
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
        console.log('Headers:', res.headers);
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
