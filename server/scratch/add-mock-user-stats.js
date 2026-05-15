const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        // Mock data
        const devices = ['MacBook Pro - Chrome', 'iPhone 13 - Safari', 'Windows PC - Edge', 'Samsung S22 - Chrome', 'iPad - Safari'];
        const locations = ['Mumbai, IN', 'Delhi, IN', 'Bangalore, IN', 'London, UK', 'New York, US', 'Dubai, UAE'];
        
        const { rows } = await client.query(`SELECT id FROM "User"`);
        
        for (const row of rows) {
            const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            const device = devices[Math.floor(Math.random() * devices.length)];
            const loc = locations[Math.floor(Math.random() * locations.length)];
            const date = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString();
            
            await client.query(`
                UPDATE "User"
                SET last_login_ip = $1,
                    last_login_device = $2,
                    last_login_location = $3,
                    last_login_at = $4
                WHERE id = $5
            `, [ip, device, loc, date, row.id]);
        }

        console.log('Mock stats added');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
