/**
 * renumber-applications.js
 * ──────────────────────────────────────────────────────────────────────
 * Renumbers all LoanApplication records with a new sequential format.
 * Starting from a specified number (default: 1 for VL-APP-2026-00001).
 * 
 * Applications are numbered in order of submission date (submittedAt).
 * Safe to run multiple times (idempotent for already numbered records).
 *
 * Run from the server/ directory:
 *   node renumber-applications.js [startNumber]
 * 
 * Example:
 *   node renumber-applications.js        # Starts from 1
 *   node renumber-applications.js 342    # Starts from 342
 * ──────────────────────────────────────────────────────────────────────
 */

const { Client } = require('pg');
require('dotenv').config();

const CURRENT_YEAR = new Date().getFullYear();

async function renumberApplications() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.\n');

    // Get starting number from command line or default to 1
    const startNumber = parseInt(process.argv[2]) || 1;
    console.log(`📋 Starting application numbers from: VL-APP-${CURRENT_YEAR}-${String(startNumber).padStart(5, '0')}\n`);

    // ── 1. Fetch all applications ordered by submission date ──────────
    const { rows: apps } = await client.query(`
      SELECT id, "applicationNumber", "submittedAt", "userId"
      FROM "LoanApplication"
      ORDER BY "submittedAt" ASC NULLS LAST, id ASC
    `);

    console.log(`📊 Total applications found: ${apps.length}`);

    if (apps.length === 0) {
      console.log('✅ No applications to renumber.');
      await client.end();
      return;
    }

    // ── 2. Begin transaction ────────────────────────────────────────
    await client.query('BEGIN');
    await client.query('SET session_replication_role = REPLICA');

    // ── 3. Renumber all applications ────────────────────────────────
    let appCounter = startNumber;
    let updated = 0;
    let skipped = 0;

    console.log('\n🔄 Renumbering applications...\n');

    for (const app of apps) {
      const newNum = `VL-APP-${CURRENT_YEAR}-${String(appCounter).padStart(5, '0')}`;
      
      const result = await client.query(
        `UPDATE "LoanApplication" SET "applicationNumber" = $1 WHERE id = $2`,
        [newNum, app.id]
      );
      
      if (result.rowCount > 0) {
        updated++;
        if (updated % 10 === 0) {
          console.log(`   ✔ Updated ${updated} applications...`);
        }
      } else {
        skipped++;
      }
      
      appCounter++;
    }

    console.log(`\n✅ Applications renumbered:`);
    console.log(`   • Updated: ${updated}`);
    console.log(`   • Skipped: ${skipped}`);

    // ── 4. Verify the update ────────────────────────────────────────
    const { rows: verified } = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN "applicationNumber" ~ '^VL-APP-\\d{4}-\\d{5}$' THEN 1 ELSE 0 END) as validFormat
      FROM "LoanApplication"
    `);

    const total = parseInt(verified[0].total);
    const validFormat = parseInt(verified[0].validformat || 0);

    console.log(`\n📊 Verification:`);
    console.log(`   • Total Applications: ${total}`);
    console.log(`   • Valid Format: ${validFormat}/${total}`);

    if (validFormat === total) {
      console.log(`   • Status: ✅ ALL APPLICATIONS SUCCESSFULLY RENUMBERED\n`);
    } else {
      console.log(`   • Status: ⚠️ ${total - validFormat} applications still have invalid format\n`);
    }

    // ── 5. Commit ───────────────────────────────────────────────────
    await client.query('SET session_replication_role = DEFAULT');
    await client.query('COMMIT');

    console.log('✅ Changes committed to database!\n');

    // ── 6. Show sample of renumbered applications ─────────────────
    const { rows: sample } = await client.query(`
      SELECT 
        "applicationNumber",
        "userId",
        "loanType",
        "submittedAt"
      FROM "LoanApplication"
      ORDER BY "applicationNumber" ASC
      LIMIT 10
    `);

    console.log('📋 Sample of renumbered applications:');
    console.log('\nApplication ID          | User ID                | Loan Type');
    console.log('-'.repeat(70));
    sample.forEach(app => {
      console.log(
        `${(app.applicationNumber || 'N/A').padEnd(23)} | ${(app.userId || 'N/A').padEnd(22)} | ${app.loanType || 'N/A'}`
      );
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error during renumbering:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

renumberApplications();
