const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || 'secretKey';

async function runTests() {
    try {
        console.log('--- Verifying user list for role "student" from NestJS server ---');
        
        // Generate JWT token for admin user
        const payload = {
            email: 'luharika28@gmail.com',
            sub: 'some-id',
            firstName: 'Harika',
            lastName: 'Lu',
            role: 'admin'
        };
        
        const token = jwt.sign(payload, secret);
        
        const listUrl = `http://localhost:${port}/api/users/admin/list?role=student&limit=30&offset=0`;
        console.log(`GET ${listUrl} ...`);
        const listRes = await fetch(listUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!listRes.ok) {
            const text = await listRes.text();
            throw new Error(`Failed to fetch user list (Status: ${listRes.status}): ${text}`);
        }
        
        const listData = await listRes.json();
        console.log('Success! Fetched user list:', listData);
        console.log('Users returned count:', listData.data.length);
        console.log('Total count from metadata:', listData.total);
        console.log('User roles returned:', listData.data.map(u => u.role));

        if (listData.total !== 4) {
            throw new Error(`Expected total count to be 4, got ${listData.total}`);
        }
        if (listData.data.length !== 4) {
            throw new Error(`Expected data array length to be 4, got ${listData.data.length}`);
        }

        console.log('\n✅ User list verification checks passed successfully!');
    } catch (err) {
        console.error('\n❌ User list verification failed:', err);
        process.exit(1);
    }
}

runTests();
