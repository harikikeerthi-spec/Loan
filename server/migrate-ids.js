/**
 * migrate-ids.js  (v2 – email-based)
 * ──────────────────────────────────────────────────────────────────────
 * Migrates all existing User IDs to email-derived IDs so that:
 *
 *   • Same email  →  same ID every time (deterministic, djb2 hash)
 *   • student/user →  VL-STU-{YEAR}-{5-digit hash}
 *   • agent        →  VL-AGT-{5-digit hash}
 *   • bank         →  VL-BNK-{3-digit hash}
 *   • staff / admin / super_admin  →  NOT changed
 *
 * Also renumbers LoanApplication.applicationNumber to VL-APP-{YEAR}-{XXXXX}
 * for any records still using the old EDU/HME/PRS/... format OR sequential
 * VL-APP-{YEAR}-{sequential} from a previous migration run.
 *
 * Safe to run multiple times (idempotent for unchanged records).
 *
 * Run from the server/ directory:
 *   node migrate-ids.js
 * ──────────────────────────────────────────────────────────────────────
 */

const { Client } = require('pg');
require('dotenv').config();

// ── djb2 hash → same algorithm used in users.service.ts ───────────────
function emailToNum(email, digits) {
  let hash = 5381;
  const lower = email.toLowerCase().trim();
  for (let i = 0; i < lower.length; i++) {
    hash = ((hash << 5) + hash + lower.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  const max = Math.pow(10, digits);
  return String(hash % max).padStart(digits, '0');
}

const CURRENT_YEAR = new Date().getFullYear();

function buildNewId(email, role) {
  if (role === 'agent') return `VL-AGT-${emailToNum(email, 5)}`;
  if (role === 'bank')  return `VL-BNK-${emailToNum(email, 3)}`;
  return `VL-STU-${CURRENT_YEAR}-${emailToNum(email, 5)}`;
}

/** True if the id was produced by the OLD random generator (4 caps + 6 digits) */
const OLD_RANDOM_RE  = /^[A-Z]{4}\d{6}$/;
/** True if the id is an old sequential VL-STU from the previous migration run */
const OLD_SEQ_VL_RE  = /^VL-(STU-\d{4}|AGT|BNK)-\d+$/;

function needsMigration(id, role) {
  if (['staff', 'admin', 'super_admin'].includes(role)) return false;
  return OLD_RANDOM_RE.test(id) || OLD_SEQ_VL_RE.test(id);
}

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
  { table: 'ForumPost',               column: 'authorId' },
  { table: 'ForumComment',            column: 'authorId' },
  { table: 'ForumCommentLike',        column: 'userId' },
  { table: 'PostLike',                column: 'userId' },
  { table: 'UniversityInquiry',       column: 'userId' },
  { table: 'OnboardingApplication',   column: 'userId' },
  { table: 'UserStudyPreference',     column: 'userId' },
  { table: 'UserAcademicProfile',     column: 'userId' },
  { table: 'UserFinancialProfile',    column: 'userId' },
  { table: 'ApplicationNote',         column: 'authorId' },
  { table: 'ApplicationStatusHistory', column: 'changedBy' },
  { table: 'AuditLog',               column: 'userId' },
  { table: 'StaffProfile',           column: 'userId' },
  { table: 'User',                   column: 'referredById' },
];

// ── main ──────────────────────────────────────────────────────────────
async function migrate() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.\n');

    // ── 1. Fetch all users ──────────────────────────────────────────
    const { rows: users } = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" ASC NULLS LAST
    `);

    const toMigrate = users.filter(u => needsMigration(u.id, u.role));
    const skipped   = users.filter(u => !needsMigration(u.id, u.role));

    console.log(`📋 Total users      : ${users.length}`);
    console.log(`🔄 Users to migrate : ${toMigrate.length}`);
    console.log(`🛡️  Skipped (staff / already correct) : ${skipped.length}\n`);

    if (toMigrate.length === 0) {
      console.log('ℹ️  All user IDs are already in the correct format.');
    }

    // ── 2. Build old → new ID map (email-derived) ───────────────────
    const idMap = new Map(); // old_id → new_id
    const usedIds = new Set(users.map(u => u.id)); // all current IDs

    for (const user of toMigrate) {
      let newId = buildNewId(user.email, user.role);

      // Collision handling: if the hash clashes with an existing id that
      // is NOT the same user, append an offset and retry
      if (usedIds.has(newId) && newId !== user.id) {
        // Try offset variants: append _1, _2, ... (very unlikely in practice)
        let found = false;
        for (let offset = 1; offset <= 99; offset++) {
          const candidate = `${newId.slice(0, -2)}${String((parseInt(newId.slice(-2)) + offset) % 100).padStart(2, '0')}`;
          if (!usedIds.has(candidate)) {
            newId = candidate;
            found = true;
            break;
          }
        }
        if (!found) {
          console.warn(`  ⚠️  Could not find collision-free ID for ${user.email} – skipping`);
          continue;
        }
      }

      idMap.set(user.id, newId);
      // Replace in usedIds so subsequent users don't collide with this new id
      usedIds.delete(user.id);
      usedIds.add(newId);
    }

    // ── 3. Preview ──────────────────────────────────────────────────
    console.log('🗺️  Mapping (old → new):');
    for (const [old, nw] of idMap) {
      const u = toMigrate.find(x => x.id === old);
      console.log(`   ${old}  →  ${nw}   (${u?.email})`);
    }
    console.log();

    // ── 4. Run inside a transaction ─────────────────────────────────
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica'); // disable FK checks
    console.log('⚙️  FK checks disabled (replica mode)\n');

    // ── 4a. Update child tables first ───────────────────────────────
    for (const { table, column } of USER_FK_COLUMNS) {
      if (idMap.size === 0) break;

      const { rows: cols } = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2 LIMIT 1
      `, [table, column]);

      if (cols.length === 0) {
        process.stdout.write(`   ⚠️  "${table}".${column} not found – skipping\n`);
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

    // ── 4b. Update User PK ──────────────────────────────────────────
    let userPkUpdated = 0;
    for (const [oldId, newId] of idMap) {
      const res = await client.query(
        `UPDATE "User" SET id = $1 WHERE id = $2`,
        [newId, oldId]
      );
      userPkUpdated += res.rowCount || 0;
    }
    console.log(`\n   ✔  "User".id: ${userPkUpdated} row(s) updated`);

    // ── 4c. Renumber applicationNumber ──────────────────────────────
    const OLD_APP_RE = /^(EDU|HME|PRS|BUS|VEH|APP)[A-Z0-9]+$/;

    const { rows: apps } = await client.query(`
      SELECT id, "applicationNumber", "submittedAt"
      FROM "LoanApplication"
      WHERE "applicationNumber" IS NOT NULL
      ORDER BY "submittedAt" ASC NULLS LAST
    `);

    const appsToFix = apps.filter(a =>
      a.applicationNumber && OLD_APP_RE.test(a.applicationNumber)
    );

    console.log(`\n📋 Applications to renumber: ${appsToFix.length}`);

    let appCounter = 1;
    // Start counter after existing VL-APP-YEAR-XXXXX entries
    const existingNums = apps
      .map(a => a.applicationNumber)
      .filter(n => n && /^VL-APP-\d{4}-\d{5}$/.test(n))
      .map(n => parseInt(n.split('-')[3], 10));
    if (existingNums.length > 0) {
      appCounter = Math.max(...existingNums) + 1;
    }

    let appUpdated = 0;
    for (const app of appsToFix) {
      const newNum = `VL-APP-${CURRENT_YEAR}-${String(appCounter++).padStart(5, '0')}`;
      const res = await client.query(
        `UPDATE "LoanApplication" SET "applicationNumber" = $1 WHERE id = $2`,
        [newNum, app.id]
      );
      appUpdated += res.rowCount || 0;
    }
    if (appUpdated > 0) {
      console.log(`   ✔  "LoanApplication"."applicationNumber": ${appUpdated} row(s) updated`);
    }

    // ── 5. Commit ───────────────────────────────────────────────────
    await client.query('SET session_replication_role = DEFAULT');
    await client.query('COMMIT');

    console.log('\n✅ Migration committed successfully!');
    console.log(`   Users migrated  : ${userPkUpdated}`);
    console.log(`   Apps renumbered : ${appUpdated}`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Migration failed – rolled back:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

migrate();
