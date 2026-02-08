// Quick test script for Community API endpoints
// Run with: node test-community-api.js

const BASE_URL = 'http://localhost:3000/community';

async function testAPI() {
    console.log('🧪 Testing Community API Endpoints...\n');

    // Test 1: Get all mentors
    console.log('1️⃣  Testing GET /community/mentors');
    try {
        const response = await fetch(`${BASE_URL}/mentors?limit=5`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...\n');
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    // Test 2: Get featured mentors
    console.log('2️⃣  Testing GET /community/mentors/featured');
    try {
        const response = await fetch(`${BASE_URL}/mentors/featured?limit=3`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Found ${data.data?.length || 0} featured mentors\n`);
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    // Test 3: Get upcoming events
    console.log('3️⃣  Testing GET /community/events/upcoming');
    try {
        const response = await fetch(`${BASE_URL}/events/upcoming?limit=5`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Found ${data.data?.length || 0} upcoming events\n`);
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    // Test 4: Get all events
    console.log('4️⃣  Testing GET /community/events');
    try {
        const response = await fetch(`${BASE_URL}/events?limit=10`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Total events: ${data.pagination?.total || 0}\n`);
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    // Test 5: Get success stories
    console.log('5️⃣  Testing GET /community/stories');
    try {
        const response = await fetch(`${BASE_URL}/stories?limit=10`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Total stories: ${data.pagination?.total || 0}\n`);
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    // Test 6: Get resources
    console.log('6️⃣  Testing GET /community/resources');
    try {
        const response = await fetch(`${BASE_URL}/resources?limit=10`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Total resources: ${data.pagination?.total || 0}\n`);
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    // Test 7: Get mentor stats
    console.log('7️⃣  Testing GET /community/mentors/stats');
    try {
        const response = await fetch(`${BASE_URL}/mentors/stats`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Statistics:`, JSON.stringify(data.data, null, 2), '\n');
    } catch (error) {
        console.log(`   ❌ Error:`, error.message, '\n');
    }

    console.log('✅ API Testing Complete!\n');
    console.log('📝 Note: To populate sample data, run the seed script:');
    console.log('   cd server/server');
    console.log('   npx ts-node scripts/seed-community.ts\n');
}

// Run the tests
testAPI().catch(console.error);
