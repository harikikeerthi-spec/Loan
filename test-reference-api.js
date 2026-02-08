// Test script for Reference Data API
const API_BASE = 'http://localhost:3000/reference';

async function testEndpoint(name, url) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            const count = Array.isArray(data.data) ? data.data.length : 1;
            console.log(`✅ ${name}: ${count} records`);
            return true;
        } else {
            console.log(`❌ ${name}: Failed`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name}: Error - ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Testing Reference Data API...\n');

    console.log('📋 LOAN TYPES:');
    await testEndpoint('  All Loan Types', `${API_BASE}/loan-types`);
    await testEndpoint('  Popular Loan Types', `${API_BASE}/loan-types/popular`);

    console.log('\n🏦 BANKS:');
    await testEndpoint('  All Banks', `${API_BASE}/banks`);
    await testEndpoint('  Popular Banks', `${API_BASE}/banks/popular`);
    await testEndpoint('  Public Banks', `${API_BASE}/banks/type/Public`);

    console.log('\n🌍 COUNTRIES:');
    await testEndpoint('  All Countries', `${API_BASE}/countries`);
    await testEndpoint('  Popular Countries', `${API_BASE}/countries/popular`);
    await testEndpoint('  Country by Code (US)', `${API_BASE}/countries/code/US`);
    await testEndpoint('  Europe Region', `${API_BASE}/countries/region/Europe`);

    console.log('\n🏛️ UNIVERSITIES:');
    await testEndpoint('  All Universities', `${API_BASE}/universities`);
    await testEndpoint('  Featured Universities', `${API_BASE}/universities/featured`);
    await testEndpoint('  USA Universities', `${API_BASE}/universities?country=United States`);

    console.log('\n💰 SCHOLARSHIPS:');
    await testEndpoint('  All Scholarships', `${API_BASE}/scholarships`);
    await testEndpoint('  USA Scholarships', `${API_BASE}/scholarships?country=United States`);

    console.log('\n📚 COURSES:');
    await testEndpoint('  All Courses', `${API_BASE}/courses`);
    await testEndpoint('  Popular Courses', `${API_BASE}/courses/popular`);
    await testEndpoint('  Masters Courses', `${API_BASE}/courses/level/Masters`);
    await testEndpoint('  Engineering Courses', `${API_BASE}/courses/field/Engineering`);

    console.log('\n✅ All tests completed!');
}

runTests();
