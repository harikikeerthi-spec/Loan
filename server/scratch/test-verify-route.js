const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';
const BASE_URL = 'http://localhost:5000/api';

function generateToken(email, role) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
    const bankToken = generateToken('shannukalneedi@gmail.com', 'bank');
    
    // Get a user document ID
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: docs } = await supabase
        .from('UserDocument')
        .select('id')
        .limit(1);

    if (!docs || docs.length === 0) {
        console.log('No user documents found.');
        return;
    }
    const docId = docs[0].id;
    console.log(`Found UserDocument ID: ${docId}`);

    // Test 1: Without vault_ prefix
    console.log(`\n--- Test 1: Updating WITHOUT vault_ prefix ---`);
    const url1 = `${BASE_URL}/applications/admin/documents/${docId}/verify`;
    console.log(`Sending PUT to: ${url1}`);
    const response1 = await fetch(url1, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bankToken}`
        },
        body: JSON.stringify({
            status: 'verified',
            rejectionReason: null
        })
    });
    console.log(`Response Status: ${response1.status}`);
    try {
        console.log('Response JSON:', await response1.json());
    } catch (e) {
        console.log('Response Text:', await response1.text());
    }

    // Test 2: With vault_ prefix
    console.log(`\n--- Test 2: Updating WITH vault_ prefix ---`);
    const url2 = `${BASE_URL}/applications/admin/documents/vault_${docId}/verify`;
    console.log(`Sending PUT to: ${url2}`);
    const response2 = await fetch(url2, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bankToken}`
        },
        body: JSON.stringify({
            status: 'verified',
            rejectionReason: null
        })
    });
    console.log(`Response Status: ${response2.status}`);
    try {
        console.log('Response JSON:', await response2.json());
    } catch (e) {
        console.log('Response Text:', await response2.text());
    }
}

main();
