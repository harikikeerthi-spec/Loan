/**
 * migrate-to-sequential-ids-v2.js
 * Fixed version that handles missing tables gracefully
 */

const { Client } = require('pg');
require('dotenv').config();

const CURRENT_YEAR = new Date().getFullYear();

// Tables with FK → User.id (only include tables that exist)
const USER_FK_COLUMNS = [
  { table: 'LoanApplication',          column: 'userId' },
  { table: 'UserDocument',             column: 'userId' },
  { table: 'Notification',             column: 'userId' },
  { table: 'LoanEligibilityCheck',     column: 'userId' },
  { table: 'VisaMockInterviewResult',  column: 'userId' },
  { table: 'ForumPost',                column: 'authorId' },
  { table: 'ForumComment',             column: 'authorId' },
  { table: 'ForumCommentLike',         column: 'userId' },
  { table: 'PostLike',                 column: 'userId' },
  { table: 'UniversityInquiry',        column: 'userId' },
  { table: 'OnboardingApplication',    column: 'userId' },
  { table: 'UserStudyPreference',      column: 'userId' },
  { table: 'UserAcademicProfile',      column: 'userId' },
  { table: 'UserFinancialProfile',     column: 'userId' },
  { table: 'ApplicationNote',          column: 'authorId' },
  { table: 'ApplicationStatusHistory', column: 'changedBy' },
  { table: 'AuditLog',                 column: 'userId' },
  { table: 'StaffProfile',             column: 'userId' },
];

async function migrate() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.\n');

    // Fetch all users
    const { rows: users } = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" ASC NULLS LAST, id ASC
    `);

    console.log(`📋 Total users found: ${users.length}\n`);

    if (users.length === 0) {
      console.log('ℹ️  No users found.');
      await client.end();
      return;
    }

    // Build ID map
    const idMap = new Map();
    users.forEach((user, index) => {
      const sequence = String(index + 1).padStart(5, '0');
      const newId = `VL-STU-${CURRENT_YEAR}-${sequence}`;
      idMap.set(user.id, newId);
    });

    // Preview
    console.log('🗺️  Mapping (first 10):');
    let count = 0;
    for (const [old, nw] of idMap) {
      const u = users.find(x => x.id === old);
      console.log(`   ${String(count + 1).padStart(5, '0')}. ${u?.email}`);
      count++;
      if (count >= 10) break;
    }
    if (idMap.size > 10) console.log(`   ... and ${idMap.size - 10} more\n`);

    // Confirm
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const proceed = await new Promise((resolve) => {
      rl.question('\n⚠️  Proceed with migration? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });

    if (!proceed) {
      console.log('\n❌ Migration cancelled.');
      await client.end();
      return;
    }

    // Start transaction
    await client.query('BEGIN');
    console.log('\n⚙️  Starting migration...\n');

    // Update foreign keys
    for (const { table, column } of USER_FK_COLUMNS) {
      // Check if table exists
      const tableCheckRes = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);

      if (!tableCheckRes.rows[0].exists) {
        console.log(`   ⏭️  "${table}" does not exist – skipping`);
        continue;
      }

      // Check if column exists
      const colCheckRes = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_name = $1 AND column_name = $2
        )
      `, [table, column]);

      if (!colCheckRes.rows[0].exists) {
        console.log(`   ⏭️  "${table}".${column} does not exist – skipping`);
        continue;
      }

      // Update rows
      let totalUpdated = 0;
      for (const [oldId, newId] of idMap) {
        const res = await client.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`,
          [newId, oldId]
        );
        totalUpdated += res.rowCount || 0;
      }

      if (totalUpdated > 0) {
        console.log(`   ✔  "${table}".${column}: ${totalUpdated} row(s) updated`);
      }
    }

    // Update User PK
    console.log('\n   Updating "User" IDs...');
    let userPkUpdated = 0;
    for (const [oldId, newId] of idMap) {
      const res = await client.query(
        `UPDATE "User" SET id = $1 WHERE id = $2`,
        [newId, oldId]
      );
      userPkUpdated += res.rowCount || 0;
    }
    console.log(`   ✔  "User".id: ${userPkUpdated} row(s) updated`);

    // Commit
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully!\n');

    // Verify
    const { rows: updated } = await client.query(`
      SELECT id, email FROM "User" ORDER BY id LIMIT 10
    `);

    console.log('✅ Updated users (first 10):');
    updated.forEach((user, idx) => {
      console.log(`   ${String(idx + 1).padStart(2, '0')}. ${user.id} (${user.email})`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    try {
      await client.query('ROLLBACK');
      console.log('   Rolled back changes.');
    } catch (e) {
      console.error('   Rollback failed:', e.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
