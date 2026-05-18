const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    const userId = 'a3accd49-0632-491b-bdf5-ed425fbe6d33';
    const docType = 'aadhaar_card';
    
    // 1. Existing check
    const existing = await supabase
      .from('UserDocument')
      .select('id, filePath, uploadedAt, verificationMetadata')
      .eq('userId', userId)
      .eq('docType', docType)
      .single();

    console.log('Existing lookup result:', {
        data: existing.data,
        error: existing.error
    });

    const payload = {
      uploaded: true,
      status: 'uploaded',
      filePath: 'test-path',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing.data) {
      console.log('Attempting UPDATE on existing ID:', existing.data.id);
      const { data: updated, error } = await supabase
        .from('UserDocument')
        .update(payload)
        .eq('id', existing.data.id)
        .select()
        .single();
        
      console.log('Update finished:', { data: updated, error });
    } else {
      console.log('Attempting INSERT...');
      const id = `${userId}_${docType}_${Date.now()}`;
      const { data: created, error } = await supabase
        .from('UserDocument')
        .insert({ id, userId, docType, ...payload })
        .select()
        .single();
        
      console.log('Insert finished:', { data: created, error });
    }
}

testUpsert();
