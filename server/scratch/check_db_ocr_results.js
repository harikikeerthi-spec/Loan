const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        console.log("Searching for recent media uploads in database...");
        
        const filesToSearch = [
            '%1779272516088%',
            '%1779272532830%',
            '%1779272679977%'
        ];
        
        for (const query of filesToSearch) {
            console.log(`\nSearch query: ${query}`);
            const res = await client.query(`
                SELECT * FROM "UserDocument" 
                WHERE "filePath" LIKE $1 OR "verificationMetadata"::text LIKE $1
            `, [query]);
            console.log(`Found in UserDocument: ${res.rows.length} rows`);
            res.rows.forEach(r => {
                console.log(`  ID: ${r.id}, docType: ${r.docType}, filePath: ${r.filePath}`);
            });

            const res2 = await client.query(`
                SELECT * FROM "ApplicationDocument" 
                WHERE "filePath" LIKE $1
            `, [query]);
            console.log(`Found in ApplicationDocument: ${res2.rows.length} rows`);
            res2.rows.forEach(r => {
                console.log(`  ID: ${r.id}, docType: ${r.docType}, filePath: ${r.filePath}`);
            });
        }
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
