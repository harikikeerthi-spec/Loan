const http = require('http');
const fs = require('fs');
require('dotenv').config();

async function testBackend() {
    const tokenPath = 'admin-token.txt';
    let altPath = 'admin_token.txt';
    let path = fs.existsSync(tokenPath) ? tokenPath : (fs.existsSync(altPath) ? altPath : null);
    
    if (!path) {
        console.error('No token file found.');
        return;
    }
    
    const token = fs.readFileSync(path, 'utf8').trim();
    console.log('Using token from:', path);

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/applications/admin/all',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        console.log('Status:', res.statusCode);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Body:', body.substring(0, 500));
        });
    });

    req.on('error', (e) => {
        console.error('Problem with request:', e.message);
    });

    req.end();
}

testBackend();
