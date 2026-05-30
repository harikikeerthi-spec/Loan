/**
 * migrate-to-sequential-ids.js
 * ──────────────────────────────────────────────────────────────────────
 * Migrates all existing User IDs to sequential format:
 *
 *   • Format: VL-STU-{YEAR}-{5-digit sequential}
 *   • First user: VL-STU-2026-00001
 *   • Second user: VL-STU-2026-00002
 *   • And so on...
 *
 * Users are numbered in order of registration (createdAt).
 * Also updates all foreign key references in related tables.
 * Safe to run multiple times (idempotent).
 *
 * Run from the server/ directory:
 *   node migrate-to-sequential-ids.js
 * ──────────────────────────────────────────────────────────────────────
 */

const { Client } = require('pg');
require('dotenv').config();

const CURRENT_YEAR = new Date().getFullYear();

// ── Tables with FK → User.id ───────────────────────────────────────────
const USER_FK_COLUMNS = [
  { table: 'LoanApplication',          column: 'userId' },
  { table: 'UserDocument',             column: 'userId' },
  { table: 'Referral',                 column: 'referrerId' },
  { table: 'Referral',                 column: 'refereeId' },
  { table: 'ReferralVisit',            column: 'referrerId' },
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
  { table: 'User',                     column: 'referredById' },
];

// ── main ──────────────────────────────────────────────────────────────
async function migrate() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.\n');

    // ── 1. Fetch all users ordered by creation date ──────────────────
    const { rows: users } = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" ASC NULLS LAST, id ASC
    `);

    console.log(`📋 Total users found: ${users.length}\n`);

    if (users.length === 0) {
      console.log('ℹ️  No users found in database.');
      await client.end();
      return;
    }

    // ── 2. Build old → new ID map (sequential) ──────────────────────
    const idMap = new Map(); // old_id → new_id

    users.forEach((user, index) => {
      const sequence = String(index + 1).padStart(5, '0');
      const newId = `VL-STU-${CURRENT_YEAR}-${sequence}`;
      idMap.set(user.id, newId);
    });

    // ── 3. Preview ──────────────────────────────────────────────────
    console.log('🗺️  Mapping (old → new):');
    let count = 0;
    for (const [old, nw] of idMap) {
      const u = users.find(x => x.id === old);
      console.log(`   ${String(count + 1).padStart(5, '0')}. ${old}  →  ${nw}   (${u?.email})`);
      count++;
      if (count >= 10) {
        if (idMap.size > 10) {
          console.log(`   ... and ${idMap.size - 10} more users`);
        }
        break;
      }
    }
    console.log();

    // ── 4. Ask for confirmation ─────────────────────────────────────
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const proceed = await new Promise((resolve) => {
      rl.question('⚠️  Proceed with migration? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });

    if (!proceed) {
      console.log('\n❌ Migration cancelled.');
      await client.end();
      return;
    }

    console.log();

    // ── 5. Run inside a transaction ─────────────────────────────────
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica'); // disable FK checks
    console.log('⚙️  FK checks disabled (replica mode)\n');

    // ── 5a. Update child tables first ───────────────────────────────
    for (const { table, column } of USER_FK_COLUMNS) {
      if (idMap.size === 0) break;

      const { rows: cols } = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2 LIMIT 1
      `, [table, column]);

      if (cols.length === 0) {
        // Table or column doesn't exist, skip silently
        continue;
      }

      let updated = 0;
      for (const [oldId, newId] of idMap) {
        const res = await client.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`,
          [newId, oldId]
        );
        updated += res.rowCount || 0;
      }
      if (updated > 0) {
        console.log(`   ✔  "${table}".${column}: ${updated} row(s) updated`);
      }
    }

    // ── 5b. Update User PK ──────────────────────────────────────────
    let userPkUpdated = 0;
    for (const [oldId, newId] of idMap) {
      const res = await client.query(
        `UPDATE "User" SET id = $1 WHERE id = $2`,
        [newId, oldId]
      );
      userPkUpdated += res.rowCount || 0;
    }
    console.log(`\n   ✔  "User".id: ${userPkUpdated} row(s) updated`);

    // ── 6. Re-enable FK checks and commit ───────────────────────────
    await client.query('SET session_replication_role = default');
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully!\n');

    // ── 7. Verify ───────────────────────────────────────────────────
    const { rows: updatedUsers } = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" ASC NULLS LAST
      LIMIT 10
    `);

    console.log('✅ Updated users (first 10):');
    updatedUsers.forEach((user, index) => {
      console.log(`   ${String(index + 1).padStart(2, '0')}. ${user.id}  (${user.email})`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    try {
      await client.query('ROLLBACK');
      console.log('   Rolled back transaction.');
    } catch (rollbackError) {
      console.error('   Failed to rollback:', rollbackError.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
