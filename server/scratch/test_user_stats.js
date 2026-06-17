const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || 'secretKey';

async function runTests() {
    try {
        console.log('--- Verifying user stats counts from NestJS server ---');
        
        // Generate JWT token for admin user
        const payload = {
            email: 'luharika28@gmail.com',
            sub: 'some-id',
            firstName: 'Harika',
            lastName: 'Lu',
            role: 'admin'
        };
        
        const token = jwt.sign(payload, secret);
        
        const statsUrl = `http://localhost:${port}/api/users/admin/stats`;
        console.log(`GET ${statsUrl} ...`);
        const statsRes = await fetch(statsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!statsRes.ok) {
            const text = await statsRes.text();
            throw new Error(`Failed to fetch user stats (Status: ${statsRes.status}): ${text}`);
        }
        
        const statsData = await statsRes.json();
        console.log('Success! Fetched user stats:', statsData);

        // Assert exact numbers matching our DB checks:
        // Users by role:
        //   staff: 1
        //   admin: 1
        //   student/user: 4
        //   bank: 1
        //   total: 7
        console.log(`\nAssertions:`);
        console.log(`- Total Users: ${statsData.total} (Expected: 7)`);
        console.log(`- Student Accounts: ${statsData.student} (Expected: 4)`);
        console.log(`- Bank Partners: ${statsData.bank} (Expected: 1)`);
        console.log(`- Staff Members: ${statsData.staff} (Expected: 1)`);
        console.log(`- Admins: ${statsData.admin} (Expected: 1)`);

        if (statsData.staff !== 1) {
            throw new Error(`Staff count mismatch! Expected 1, got ${statsData.staff}`);
        }
        if (statsData.admin !== 1) {
            throw new Error(`Admin count mismatch! Expected 1, got ${statsData.admin}`);
        }
        if (statsData.student !== 4) {
            throw new Error(`Student count mismatch! Expected 4, got ${statsData.student}`);
        }
        if (statsData.bank !== 1) {
            throw new Error(`Bank count mismatch! Expected 1, got ${statsData.bank}`);
        }
        if (statsData.total !== 7) {
            throw new Error(`Total users count mismatch! Expected 7, got ${statsData.total}`);
        }

        console.log('\n✅ User statistics verification checks passed successfully!');
    } catch (err) {
        console.error('\n❌ User statistics verification failed:', err);
        process.exit(1);
    }
}

runTests();
