require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrate() {
  console.log('Adding fileUrl column to SupportAttachment...');
  
  // Add fileUrl column if it doesn't already exist
  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE "SupportAttachment" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;`
  });

  if (error) {
    // Try direct query approach
    const { error: err2 } = await supabase
      .from('SupportAttachment')
      .select('fileUrl')
      .limit(1);
    
    if (err2 && err2.message.includes('column') && err2.message.includes('does not exist')) {
      console.error('Column does not exist and could not be added via RPC:', error.message);
      console.log('\nPlease run this SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE "SupportAttachment" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;');
    } else {
      console.log('Column already exists or was added successfully.');
    }
  } else {
    console.log('✅ fileUrl column added successfully!');
  }
}

migrate().catch(console.error);
