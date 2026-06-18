const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkEmails() {
  console.log('Fetching latest 5 applications...');
  const { data: apps, error } = await supabase
    .from('LoanApplication')
    .select('*, user:User!userId(*)')
    .order('submittedAt', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Failed to fetch applications:', error);
    return;
  }

  console.log(`Found ${apps.length} applications.`);
  for (const app of apps) {
    console.log('\n----------------------------------------');
    console.log(`App ID: ${app.id}`);
    console.log(`App Number: ${app.applicationNumber}`);
    console.log(`Status: ${app.status}`);
    console.log(`Submitted At: ${app.submittedAt}`);
    console.log(`App Email field: "${app.email}"`);
    console.log(`User ID: ${app.userId}`);
    if (app.user) {
      console.log(`User Email (registered): "${app.user.email}"`);
      console.log(`User Name: "${app.user.firstName} ${app.user.lastName}"`);
    } else {
      console.log(`User relationship: NULL (User not found for userId: ${app.userId})`);
    }
  }
}

checkEmails().catch(err => console.error(err));
