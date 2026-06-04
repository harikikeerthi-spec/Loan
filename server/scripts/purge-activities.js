/**
 * purge-activities.js
 * Purges all AuditLog entries where action = 'STAFF_ACTIVITY'.
 * Run: node scripts/purge-activities.js
 */
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mhhmqdbzsmwyizmvwtsx:VidhyaLOan2@13.239.87.90:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully. Purging AuditLog 'STAFF_ACTIVITY' records...");

    const res = await client.query("DELETE FROM \"AuditLog\" WHERE action = 'STAFF_ACTIVITY'");
    console.log(`Successfully deleted ${res.rowCount} records.`);

  } catch (err) {
    console.error("Error purging activities:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

main();
