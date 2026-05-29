/**
 * check-user-ids.js
 * ──────────────────────────────────────────────────────────────────────
 * Checks current user IDs format and lists all users with their IDs.
 * Run from the server/ directory:
 *   node check-user-ids.js
 * ──────────────────────────────────────────────────────────────────────
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkUserIds() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.\n');

    // Fetch all users ordered by creation date
    const { rows: users } = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" ASC NULLS LAST
    `);

    console.log(`📋 Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found.');
      await client.end();
      return;
    }

    // Check format
    const SEQUENTIAL_PATTERN = /^VL-STU-\d{4}-\d{5}$/;
    let sequentialCount = 0;
    let otherFormats = 0;

    console.log('Users in database:\n');
    console.log('# | ID                  | Email                           | Role      | CreatedAt');
    console.log('-'.repeat(95));

    users.forEach((user, index) => {
      const isSequential = SEQUENTIAL_PATTERN.test(user.id);
      if (isSequential) sequentialCount++;
      else otherFormats++;

      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
      console.log(
        `${String(index + 1).padStart(2, ' ')} | ${user.id.padEnd(19)} | ${(user.email || 'N/A').padEnd(31)} | ${(user.role || 'user').padEnd(9)} | ${createdAt}`
      );
    });

    console.log('\n' + '='.repeat(95));
    console.log(`📊 Format Analysis:`);
    console.log(`   • Sequential (VL-STU-YYYY-00001): ${sequentialCount} users`);
    console.log(`   • Other formats: ${otherFormats} users`);

    if (otherFormats > 0) {
      console.log('\n⚠️  Migration needed! Run: node migrate-to-sequential-ids.js');
    } else {
      console.log('\n✅ All user IDs are in sequential format!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkUserIds();
