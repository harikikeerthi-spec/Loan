require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedStaffAccounts() {
  const staffEmails = [
    { email: 'staffloans@gmail.com', firstName: 'Staff', lastName: 'Loans' },
    { email: 'staffvidyaloans@gmail.com', firstName: 'Staff', lastName: 'VidyaLoans' }
  ];

  for (const staff of staffEmails) {
    console.log(`\n--- Processing Staff: ${staff.email} ---`);
    
    // 1. Check or create User
    let { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', staff.email)
      .maybeSingle();

    if (!user) {
      console.log(`User ${staff.email} not found. Creating user record...`);
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          email: staff.email,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: 'staff',
          createdAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error(`Failed to create User ${staff.email}:`, createError);
        continue;
      }
      user = newUser;
      console.log(`Created User record: ${user.id}`);
    } else {
      console.log(`User record exists: ${user.id} (Role: ${user.role})`);
      if (user.role !== 'staff') {
        console.log(`Updating role to 'staff'...`);
        await supabase.from('User').update({ role: 'staff' }).eq('id', user.id);
      }
    }

    // 2. Check or create StaffProfile
    let { data: profile, error: profileError } = await supabase
      .from('StaffProfile')
      .select('*')
      .or(`linkedUserId.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!profile) {
      console.log(`StaffProfile for ${user.id} not found. Creating profile...`);
      const { data: newProfile, error: createProfileErr } = await supabase
        .from('StaffProfile')
        .insert({
          linkedUserId: user.id,
          isAvailable: true,
          isOnLeave: false,
          currentWorkload: 0,
          maxWorkload: 20,
          staffRole: 'loan_officer',
          createdAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createProfileErr) {
        console.error(`Failed to create StaffProfile:`, createProfileErr);
      } else {
        console.log(`Created StaffProfile: ${newProfile.id}`);
      }
    } else {
      console.log(`Updating StaffProfile to ensure isAvailable=true, isOnLeave=false...`);
      await supabase
        .from('StaffProfile')
        .update({
          isAvailable: true,
          isOnLeave: false,
          staffRole: 'loan_officer'
        })
        .eq('id', profile.id);
      console.log(`StaffProfile updated successfully.`);
    }
  }

  // 3. Print all eligible staff profiles
  const { data: allStaff } = await supabase
    .from('StaffProfile')
    .select('*, linkedUser:User!linkedUserId(id, email, firstName, lastName)');

  console.log('\n================ ELIGIBLE STAFF FOR ROUND ROBIN ================');
  console.table(allStaff?.map(s => ({
    profileId: s.id,
    userId: s.linkedUserId,
    email: s.linkedUser?.email || s.email,
    isAvailable: s.isAvailable,
    isOnLeave: s.isOnLeave,
    currentWorkload: s.currentWorkload,
    maxWorkload: s.maxWorkload
  })));
}

seedStaffAccounts().catch(console.error);
