const { Client } = require('pg');
require('dotenv').config();

async function promoteToAgent() {
    const email = 'pkfc0406@gmail.com';
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log(`Checking current role for ${email}...`);
    const checkRes = await client.query("SELECT role FROM \"User\" WHERE email = $1", [email]);
    
    if (checkRes.rows.length === 0) {
        console.log("User not found!");
    } else {
        console.log(`Current role: ${checkRes.rows[0].role}`);
        console.log(`Updating role to 'agent'...`);
        await client.query("UPDATE \"User\" SET role = 'agent' WHERE email = $1", [email]);
        console.log("Success! Role updated to 'agent'.");
    }
    
    await client.end();
}

promoteToAgent().catch(console.error);
