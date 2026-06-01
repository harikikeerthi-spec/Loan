const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log("Supabase URL:", supabaseUrl ? "Loaded" : "Not loaded");
console.log("Supabase Service Key:", supabaseKey ? "Loaded" : "Not loaded");

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Environment variables are not loaded. Please make sure .env exists in the server directory.");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("\n--- Querying User table ---");
  const { data: users, error: userError } = await db.from('User').select('id, email, firstName, lastName, role').limit(1);
  if (userError) {
    console.error("User Table Query Error:", userError);
  } else {
    console.log("User Table Sample Data:", users);
  }

  console.log("\n--- Querying Referral table ---");
  const { data: refData, error: refError } = await db.from('Referral').select('*').limit(1);
  if (refError) {
    console.error("Referral Table Query Error:", refError);
  } else {
    console.log("Referral Table Sample Data:", refData);
  }

  console.log("\n--- Querying ReferralVisit table ---");
  const { data: visData, error: visError } = await db.from('ReferralVisit').select('*').limit(1);
  if (visError) {
    console.error("ReferralVisit Table Query Error:", visError);
  } else {
    console.log("ReferralVisit Table Sample Data:", visData);
  }
}

test().catch(console.error);
