const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
    // Determine the environment variables for Supabase url and key
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(url, key);
    
    // Find a valid user first
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    const userRes = await client.query('SELECT id FROM "User" LIMIT 1');
    await client.end();
    if (userRes.rows.length === 0) {
        console.error('No users found');
        return;
    }
    const userId = userRes.rows[0].id;
    console.log('Using userId:', userId);

    // Try inserting via supabase
    const { data, error } = await supabase.from('Notification').insert({
        id: 'test-sb-' + Date.now(),
        userId: userId,
        title: 'Supabase Test',
        body: 'Supabase Body',
        type: 'test',
        isRead: false,
        timestamp: new Date().toISOString()
    }).select().single();

    if (error) {
        console.error('Supabase Error:', error);
    } else {
        console.log('Supabase Success:', data);
        // Clean up
        const { error: delError } = await supabase.from('Notification').delete().eq('id', data.id);
        console.log('Delete cleanup:', delError ? delError : 'Success');
    }
}
test().catch(console.error);
