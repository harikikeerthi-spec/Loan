const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const http = require('http');

async function testFrontendActivities() {
    console.log('Booting NestJS app context to get token...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const jwtService = app.get(require('@nestjs/jwt').JwtService);

    // Sign a token for staffvidhya@gmail.com
    const payload = {
        email: 'staffvidhya@gmail.com',
        sub: '8ecf51c2-c9ac-4c76-9147-0c1ca96a8e51',
        firstName: 'Staff',
        lastName: 'Vidhya',
        role: 'staff'
    };
    const token = await jwtService.signAsync(payload);
    console.log('Generated JWT token:', token);
    await app.close();

    // Now make the HTTP request to port 3000
    const postData = JSON.stringify({
        type: 'info',
        msg: 'Testing log activity from frontend proxy script',
        icon: 'event_note',
        color: 'text-slate-600 bg-slate-50'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/staff-profiles/activities',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('Sending request to http://localhost:3000/api/staff-profiles/activities...');
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

testFrontendActivities().catch(console.error);
