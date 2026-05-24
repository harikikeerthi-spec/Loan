const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const http = require('http');

async function testHttpActivities() {
    console.log('Booting NestJS app context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const jwtService = app.get(require('@nestjs/jwt').JwtService);

    // Sign a token for staff@vidhyaloans.com
    const payload = { email: 'staff@vidhyaloans.com', role: 'staff' };
    const token = await jwtService.signAsync(payload);
    console.log('Generated JWT token:', token);
    await app.close();

    // Now make the HTTP request
    const postData = JSON.stringify({
        type: 'info',
        msg: 'Testing log activity from HTTP test script',
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
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('Sending request to /api/staff-profiles/activities...');
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
        console.error('Request Error:', e);
    });

    req.write(postData);
    req.end();
}

testHttpActivities().catch(console.error);
