const { Client } = require('pg');
require('dotenv').config();

async function checkApp() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();

    // Get LoanApplication schema
    const schemaRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'LoanApplication'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== LoanApplication Schema ===`);
    console.log(schemaRes.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // Get a sample app with data
    const appRes = await client.query(`SELECT * FROM "LoanApplication" LIMIT 1`);
    if (appRes.rows.length > 0) {
        console.log(`\n=== Sample LoanApplication ===`);
        console.log(JSON.stringify(appRes.rows[0], null, 2));
    }

    // BankQuery schema
    const bqSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'BankQuery'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== BankQuery Schema ===`);
    console.log(bqSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // BankDecision schema
    const bdSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'BankDecision'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== BankDecision Schema ===`);
    console.log(bdSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // Disbursement schema
    const dSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Disbursement'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== Disbursement Schema ===`);
    console.log(dSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // ProcessingFee schema
    const pfSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ProcessingFee'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== ProcessingFee Schema ===`);
    console.log(pfSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // ConsentRecord schema
    const crSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ConsentRecord'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== ConsentRecord Schema ===`);
    console.log(crSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // FileDocument schema
    const fdSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'FileDocument'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== FileDocument Schema ===`);
    console.log(fdSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    // FileEntry schema
    const feSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'FileEntry'
        ORDER BY ordinal_position
    `);
    console.log(`\n=== FileEntry Schema ===`);
    console.log(feSchema.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

    await client.end();
}

checkApp().catch(console.error);
