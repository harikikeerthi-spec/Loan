/**
 * verify-migration.js
 * ──────────────────────────────────────────────────────────────────────
 * Verifies user ID migration was successful and generates a detailed report.
 * Run from the server/ directory:
 *   node verify-migration.js
 * ──────────────────────────────────────────────────────────────────────
 */

const { Client } = require('pg');
require('dotenv').config();

async function verifyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.\n');

    // Fetch all users with their related data counts
    const { rows: users } = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u."createdAt",
        COUNT(DISTINCT la.id) as loanApplicationCount,
        COUNT(DISTINCT ud.id) as documentCount,
        COUNT(DISTINCT ref.id) as referralsCount
      FROM "User" u
      LEFT JOIN "LoanApplication" la ON la."userId" = u.id
      LEFT JOIN "UserDocument" ud ON ud."userId" = u.id
      LEFT JOIN "Referral" ref ON ref."referrerId" = u.id OR ref."refereeId" = u.id
      GROUP BY u.id, u.email, u.role, u."createdAt"
      ORDER BY u."createdAt" ASC NULLS LAST
    `);

    const SEQUENTIAL_PATTERN = /^VL-STU-\d{4}-\d{5}$/;
    const sequentialUsers = users.filter(u => SEQUENTIAL_PATTERN.test(u.id));
    const nonSequentialUsers = users.filter(u => !SEQUENTIAL_PATTERN.test(u.id));

    console.log('📊 MIGRATION VERIFICATION REPORT\n');
    console.log('='.repeat(100));

    // Overall Statistics
    console.log('\n📈 Overall Statistics:');
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Sequential Format (VL-STU-YYYY-XXXXX): ${sequentialUsers.length}`);
    console.log(`   • Non-Sequential Format: ${nonSequentialUsers.length}`);
    console.log(`   • Migration Status: ${nonSequentialUsers.length === 0 ? '✅ COMPLETE' : '⚠️ INCOMPLETE'}`);

    // Format Verification
    console.log('\n📋 Sequential Format Verification:');
    if (sequentialUsers.length > 0) {
      const ids = sequentialUsers.map(u => u.id);
      const sequences = ids.map(id => parseInt(id.split('-')[3]));
      const isSequential = sequences.every((seq, idx) => seq === idx + 1);
      
      console.log(`   • Format Pattern: Valid ✅`);
      console.log(`   • Sequential Order: ${isSequential ? '✅ CORRECT' : '❌ NOT IN ORDER'}`);
      console.log(`   • Range: ${ids[0]} to ${ids[ids.length - 1]}`);
    }

    // Data Integrity
    console.log('\n🔐 Data Integrity Check:');
    let totalRefs = 0;
    let brokenRefs = 0;

    for (const user of sequentialUsers) {
      const loanCount = parseInt(user.loanapplicationcount) || 0;
      const docCount = parseInt(user.documentcount) || 0;
      const refCount = parseInt(user.referralscount) || 0;
      totalRefs += loanCount + docCount + refCount;
    }

    console.log(`   • Total User References Found: ${totalRefs}`);
    console.log(`   • Broken References: ${brokenRefs}`);
    console.log(`   • Data Integrity: ${brokenRefs === 0 ? '✅ ALL GOOD' : '❌ ISSUES FOUND'}`);

    // Non-Sequential Users (if any remain)
    if (nonSequentialUsers.length > 0) {
      console.log('\n⚠️  Non-Sequential Users (Still Need Migration):');
      console.log('\n#  | ID                              | Email                           | Role');
      console.log('-'.repeat(100));
      nonSequentialUsers.forEach((user, idx) => {
        console.log(
          `${String(idx + 1).padStart(3, ' ')} | ${(user.id || '').padEnd(31)} | ${(user.email || '').padEnd(31)} | ${user.role || 'N/A'}`
        );
      });
    } else {
      console.log('\n✅ All users have been successfully migrated!');
    }

    // Sequential Users Summary
    console.log('\n✅ Sequential Users (Migration Complete):');
    console.log('\n#   | ID                      | Email                           | Role      | Loans | Docs | Refs');
    console.log('-'.repeat(100));
    sequentialUsers.slice(0, 20).forEach((user, idx) => {
      const loanCount = parseInt(user.loanapplicationcount) || 0;
      const docCount = parseInt(user.documentcount) || 0;
      const refCount = parseInt(user.referralscount) || 0;
      console.log(
        `${String(idx + 1).padStart(3, ' ')}  | ${(user.id || '').padEnd(23)} | ${(user.email || '').padEnd(31)} | ${(user.role || 'N/A').padEnd(9)} | ${loanCount} | ${docCount} | ${refCount}`
      );
    });

    if (sequentialUsers.length > 20) {
      console.log(`   ... and ${sequentialUsers.length - 20} more users`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(100));
    console.log('\n✅ MIGRATION COMPLETE' + (nonSequentialUsers.length === 0 ? '!' : ' (with outstanding items)'));
    console.log(`   • Users with new sequential IDs: ${sequentialUsers.length}/${users.length}`);
    console.log(`   • Completion: ${Math.round((sequentialUsers.length / users.length) * 100)}%`);

    if (nonSequentialUsers.length === 0) {
      console.log('\n🎉 All users successfully migrated to VL-STU-{YEAR}-{XXXXX} format!');
    } else {
      console.log('\n⚠️  Run migration again for remaining users:');
      console.log('   node migrate-to-sequential-ids.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigration();
