const dotenv = require('dotenv');
const path = require('path');
// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const http = require('http');

async function testNotif() {
    console.log('Booting NestJS app context to get token...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const jwtService = app.get(require('@nestjs/jwt').JwtService);

    // Sign a token for a bank user
    const payload = {
        email: 'hellobro24@gmail.com',
        sub: 'VL-STU-2026-00006',
        firstName: 'Hello',
        lastName: 'Bro',
        role: 'bank'
    };
    const token = await jwtService.signAsync(payload);
    console.log('Generated JWT token:', token);
    await app.close();

    // Helper to send request
    const sendRequest = (port, path) => {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: path,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            console.log(`\nSending request to http://localhost:${port}${path}...`);
            const req = http.request(options, (res) => {
                console.log(`[Port ${port}] Status:`, res.statusCode);
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    console.log(`[Port ${port}] Body:`, body);
                    resolve({ status: res.statusCode, body });
                });
            });

            req.on('error', (e) => {
                console.error(`[Port ${port}] Request Error:`, e.message);
                resolve({ error: e.message });
            });
            req.end();
        });
    };

    // Test port 5000 (NestJS)
    await sendRequest(5000, '/api/notifications');

    // Test port 3000 (Next.js proxy)
    await sendRequest(3000, '/api/notifications');
}

testNotif().catch(console.error);
