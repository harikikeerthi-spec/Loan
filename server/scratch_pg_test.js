const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@13.239.87.90:5432/postgres',
  connectionTimeoutMillis: 5000 
});

async function test() {
    console.log("Connecting to Supabase Postgres...");
    try {
        await client.connect();
        console.log("Connected to PostgreSQL successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Query Result: ", res.rows[0]);
    } catch (e) {
        console.error("Postgres Error: ", e.message);
    } finally {
        await client.end();
    }
}
test();
