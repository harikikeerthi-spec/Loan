const axios = require('axios');

const BASE_URL = 'http://localhost:3000/community/explore';

async function testExploreAPI() {
    console.log('🚀 Testing Explore Hub API...\n');

    const topics = ['eligibility', 'universities', 'courses', 'scholarships', 'visa'];

    for (const topic of topics) {
        try {
            console.log(`Checking Hub: ${topic}...`);
            const response = await axios.get(`${BASE_URL}/hub/${topic}`);

            if (response.data.success) {
                const hub = response.data.data.hub;
                console.log(`✅ Success! Title: "${hub.title}"`);
                console.log(`   Mentors: ${response.data.data.mentors.length}, Events: ${response.data.data.events.length}, Resources: ${response.data.data.resources.length}`);
                console.log(`   Stats - Active Mentors: ${hub.stats.activeMentors}, Discussions: ${hub.stats.discussions}\n`);
            } else {
                console.log(`❌ Failed for ${topic}:`, response.data.message);
            }
        } catch (error) {
            console.error(`❌ Error testing ${topic}:`, error.message);
        }
    }

    try {
        console.log('Checking All Hubs list...');
        const response = await axios.get(`${BASE_URL}/hubs`);
        if (response.data.success) {
            console.log(`✅ Success! Found ${response.data.data.length} hubs.\n`);
        }
    } catch (error) {
        console.error('❌ Error testing /hubs:', error.message);
    }
}

testExploreAPI();
