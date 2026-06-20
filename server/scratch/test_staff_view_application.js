const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';
const BASE_URL = 'http://localhost:5000/api';

function generateToken(email, role) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
  console.log('Connecting to Supabase...');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Find a staff user
  console.log('Finding a staff user...');
  const { data: staffUsers, error: staffErr } = await supabase
    .from('User')
    .select('email, role')
    .eq('role', 'staff')
    .limit(1);

  if (staffErr || !staffUsers || staffUsers.length === 0) {
    console.log('No staff users found in database. Using a generic staff email...');
  }
  const staffEmail = (staffUsers && staffUsers[0]) ? staffUsers[0].email : 'staff@vidyaloan.com';
  console.log(`Using staff user email: ${staffEmail}`);

  // Find a submitted application that hasn't started review yet (or we can use any submitted one)
  console.log('Finding a submitted loan application...');
  const { data: apps, error: appErr } = await supabase
    .from('LoanApplication')
    .select('id, applicationNumber, status, reviewStartedAt')
    .eq('status', 'submitted')
    .limit(1);

  if (appErr || !apps || apps.length === 0) {
    console.log('No submitted loan applications found. Finding any loan application...');
    const { data: anyApps } = await supabase
      .from('LoanApplication')
      .select('id, applicationNumber, status, reviewStartedAt')
      .limit(1);
      
    if (!anyApps || anyApps.length === 0) {
      console.error('No loan applications found in database. Please run the server and submit an application first.');
      return;
    }
    apps.push(anyApps[0]);
  }

  const targetApp = apps[0];
  console.log(`Found Application ID: ${targetApp.id}, Number: ${targetApp.applicationNumber}, Status: ${targetApp.status}, ReviewStartedAt: ${targetApp.reviewStartedAt}`);

  // If status is not submitted, let's temporarily update it to 'submitted' and set reviewStartedAt to null to test the review start flow
  const originalStatus = targetApp.status;
  const originalReviewStartedAt = targetApp.reviewStartedAt;

  if (targetApp.status !== 'submitted' || targetApp.reviewStartedAt) {
    console.log('Updating application status to "submitted" and reviewStartedAt to null for testing...');
    const { error: updateErr } = await supabase
      .from('LoanApplication')
      .update({ status: 'submitted', reviewStartedAt: null })
      .eq('id', targetApp.id);
    
    if (updateErr) {
      console.error('Failed to update application for testing:', updateErr);
      return;
    }
  }

  const staffToken = generateToken(staffEmail, 'staff');
  const url = `${BASE_URL}/applications/${targetApp.id}`;
  
  console.log(`\n--- Sending GET request to ${url} as staff user ---`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    }
  });

  console.log(`Response Status: ${response.status}`);
  let responseData;
  try {
    responseData = await response.json();
    console.log('Response Success:', responseData.success);
    if (responseData.data) {
      console.log('Application details returned successfully.');
      console.log(`Updated Status: ${responseData.data.status}`);
      console.log(`Updated ReviewStartedAt: ${responseData.data.reviewStartedAt}`);
    } else {
      console.log('Response details:', responseData);
    }
  } catch (e) {
    console.log('Response Text:', await response.text());
  }

  // Restore the original state if we modified it
  if (originalStatus !== 'submitted' || originalReviewStartedAt) {
    console.log('\nRestoring original application state...');
    await supabase
      .from('LoanApplication')
      .update({ status: originalStatus, reviewStartedAt: originalReviewStartedAt })
      .eq('id', targetApp.id);
  }
}

main().catch(err => {
  console.error('Execution failed:', err);
});
