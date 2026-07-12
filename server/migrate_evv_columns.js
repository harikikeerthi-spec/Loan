/**
 * EVV Schema Migration via Supabase pg driver
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Use the Supabase SQL API endpoint directly
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function runSQL(sql) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  });
  return resp;
}

const columns = [
  { name: 'evvTotalSnapshots', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvTotalSnapshots" INTEGER` },
  { name: 'evvTotalTransactions', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvTotalTransactions" INTEGER` },
  { name: 'evvPeriod', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvPeriod" JSONB` },
  { name: 'evvScore', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvScore" DOUBLE PRECISION` },
  { name: 'evvGrade', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvGrade" TEXT` },
  { name: 'evvDecision', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvDecision" TEXT` },
  { name: 'evvDecisionReason', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvDecisionReason" TEXT` },
  { name: 'evvRiskFlags', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvRiskFlags" JSONB` },
  { name: 'evvBehaviours', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvBehaviours" JSONB` },
  { name: 'evvMonthlyMetrics', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvMonthlyMetrics" JSONB` },
  { name: 'evvValidation', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvValidation" JSONB` },
  { name: 'evvWeightBreakdown', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvWeightBreakdown" JSONB` },
  { name: 'evvSnapshots', sql: `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "evvSnapshots" JSONB` },
];

// Try using Supabase's SQL API (available via dashboard API)
async function migrateViaSupabaseSQL() {
  console.log('Trying Supabase SQL API...');
  
  // Combine all ALTER statements into one transaction
  const combinedSQL = columns.map(c => c.sql).join(';\n');
  
  const resp = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ query: combinedSQL }),
  });
  
  const text = await resp.text();
  console.log(`Status: ${resp.status}`, text.slice(0, 200));
  return resp.ok;
}

// Try the Supabase Management API
async function migrateViaManagementAPI() {
  // Extract project ref from URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.log('Could not extract project ref from URL');
    return false;
  }
  
  console.log(`Trying Management API for project: ${projectRef}`);
  const combinedSQL = columns.map(c => c.sql).join(';\n');
  
  const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: combinedSQL }),
  });
  
  const text = await resp.text();
  console.log(`Management API Status: ${resp.status}`, text.slice(0, 300));
  return resp.ok;
}

async function main() {
  console.log('🚀 EVV Intelligence Engine — Schema Migration\n');
  
  let success = await migrateViaManagementAPI();
  if (!success) {
    success = await migrateViaSupabaseSQL();
  }
  
  if (!success) {
    console.log('\n📋 Please run the following SQL in Supabase SQL Editor:');
    console.log('Go to: https://supabase.com/dashboard/project/mhhmqdbzsmwyizmvwtsx/sql/new\n');
    columns.forEach(c => console.log(c.sql + ';'));
  }
}

main().catch(console.error);
