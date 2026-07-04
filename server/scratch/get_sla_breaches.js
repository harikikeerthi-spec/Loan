const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    try {
        console.log('Querying all loan applications...');
        const res = await client.query(`
            SELECT id, "applicationNumber", "firstName", "lastName", status, "lanNumber", "submittedAt", amount, bank, email
            FROM "LoanApplication"
        `);

        console.log(`Total applications fetched: ${res.rows.length}`);
        
        const excludedStatuses = [
            "rejected", "approved", "disbursed", "submitted", "pending", 
            "draft", "docs_received", "staff_verified", "application_submitted"
        ];

        const now = new Date();
        const incomingApps = res.rows.filter(app => {
            // Must not have a LAN to be in "Incoming Queue"
            if (app.lanNumber) return false;
            // Must not have excluded status
            if (excludedStatuses.includes(app.status)) return false;
            return true;
        });

        console.log(`Incoming queue applications count: ${incomingApps.length}`);

        const breachedApps = incomingApps.filter(app => {
            if (!app.submittedAt) return false;
            const submittedDate = new Date(app.submittedAt);
            const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
            return hoursDiff > 24;
        });

        console.log(`\n=== SLA Breached Applications (> 24h) in Incoming Queue (Total: ${breachedApps.length}) ===`);
        if (breachedApps.length === 0) {
            console.log("No applications have breached the >24h SLA.");
        } else {
            breachedApps.forEach(app => {
                const submittedDate = new Date(app.submittedAt);
                const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
                console.log(`- App: ${app.applicationNumber} | Student: ${app.firstName} ${app.lastName} | Email: ${app.email}`);
                console.log(`  Bank: ${app.bank} | Status: ${app.status} | Amount: ₹${app.amount}`);
                console.log(`  Submitted At: ${app.submittedAt} (${hoursDiff.toFixed(1)} hours ago)`);
                console.log('--------------------------------------------------');
            });
        }

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await client.end();
    }
}

run();
