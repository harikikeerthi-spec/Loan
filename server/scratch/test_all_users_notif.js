const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const http = require('http');

async function testAll() {
    console.log('Booting NestJS app context to get users and jwtService...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const jwtService = app.get(require('@nestjs/jwt').JwtService);
    const supabase = app.get(require('../dist/supabase/supabase.service').SupabaseService);

    // Fetch all users
    const { data: users, error } = await supabase.getClient().from('User').select('*');
    if (error) {
        console.error("Failed to fetch users:", error);
        await app.close();
        return;
    }

    console.log(`Found ${users.length} users. Testing notification API for each...`);

    const sendRequest = (token) => {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: 5000,
                path: '/api/notifications',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    resolve({ status: res.statusCode, body });
                });
            });

            req.on('error', (e) => {
                resolve({ error: e.message });
            });
            req.end();
        });
    };

    for (const user of users) {
        const payload = {
            email: user.email,
            sub: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };
        const token = await jwtService.signAsync(payload);
        const res = await sendRequest(token);
        console.log(`User: ${user.email} (Role: ${user.role}, ID: ${user.id}) -> Status: ${res.status}, Body: ${res.body}`);
    }

    await app.close();
}

testAll().catch(console.error);
