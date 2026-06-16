const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || 'secretKey';

async function runTests() {
    try {
        console.log('--- Verifying notifications endpoint from NestJS server ---');
        
        // Generate JWT token for admin user
        const payload = {
            email: 'harikikeerthi@gmail.com',
            sub: 'VL-STU-2026-00001',
            firstName: 'Hariki',
            lastName: 'Keerthi',
            role: 'admin'
        };
        
        const token = jwt.sign(payload, secret);
        
        const notificationsUrl = `http://localhost:${port}/api/notifications`;
        console.log(`GET ${notificationsUrl} ...`);
        const res = await fetch(notificationsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch notifications (Status: ${res.status}): ${text}`);
        }
        
        const data = await res.json();
        console.log('Success! Fetched notifications:', data);
        
        // Test mark read if we have any notifications
        if (data.success && data.items && data.items.length > 0) {
            const firstNotif = data.items[0];
            const markUrl = `http://localhost:${port}/api/notifications/${firstNotif.id}/mark-read`;
            console.log(`PUT ${markUrl} ...`);
            const markRes = await fetch(markUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (markRes.ok) {
                console.log('Success! Marked notification as read.');
            } else {
                console.error('Failed to mark notification as read:', await markRes.text());
            }
        }
    } catch (err) {
        console.error('\n❌ Notifications endpoint check failed:', err);
        process.exit(1);
    }
}

runTests();
