const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function main() {
    const oldEmail = 'shannukalneedi@gmail.com';
    const newEmail = 'pkfc0406@gmail.com';
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log(`Updating user email from ${oldEmail} to ${newEmail}...`);
    const updateRes = await client.query('UPDATE "User" SET email = $1 WHERE email = $2', [newEmail, oldEmail]);
    console.log(`Updated rows: ${updateRes.rowCount}`);
    
    await client.end();
}

main().catch(console.error);
