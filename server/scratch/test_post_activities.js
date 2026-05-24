const http = require('http');
const fs = require('fs');
require('dotenv').config();

async function testPostActivities() {
    // Try to find a token
    const tokenPaths = ['admin-token.txt', 'admin_token.txt', 'admin_token_final.txt', 'admin_token_final_clean.txt'];
    let token = '';
    for (const p of tokenPaths) {
        if (fs.existsSync(p)) {
            token = fs.readFileSync(p, 'utf8').trim();
            console.log('Using token from:', p);
            break;
        }
    }
    
    if (!token) {
        // Look in parent folder too
        for (const p of tokenPaths) {
            const parentPath = '../' + p;
            if (fs.existsSync(parentPath)) {
                token = fs.readFileSync(parentPath, 'utf8').trim();
                console.log('Using token from parent:', parentPath);
                break;
            }
        }
    }

    if (!token) {
        console.error('No token file found.');
        return;
    }

    const payload = JSON.stringify({
        type: 'info',
        msg: 'Testing log activity from scratch script',
        icon: 'event_note',
        color: 'text-slate-600 bg-slate-50'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/staff-profiles/activities',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = http.request(options, (res) => {
        console.log('Response Status:', res.statusCode);
        console.log('Headers:', res.headers);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Response Body:', body);
        });
    });

    req.on('error', (e) => {
        console.error('Problem with request:', e.message);
    });

    req.write(payload);
    req.end();
}

testPostActivities().catch(console.error);
