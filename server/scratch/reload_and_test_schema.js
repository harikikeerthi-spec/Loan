const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('Sending NOTIFY pgrst, \'reload schema\'...');
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('Schema reload notified.');
    } catch (err) {
        console.error('Failed to notify pgrst:', err);
    } finally {
        await client.end();
    }

    // Now test with Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Testing Supabase select on User table including registeredAtIndia...');
    const { data, error } = await supabase
        .from('User')
        .select('id, email, registeredAtIndia')
        .limit(1);

    if (error) {
        console.error('Supabase query error:', error);
    } else {
        console.log('Supabase query success! Result:', data);
    }
}

test();
