// Test Mentor OTP Login
// This script helps you test the mentor OTP login flow

const API_BASE_URL = 'http://localhost:3000';

async function testMentorOTPFlow() {
    console.log('=== Mentor OTP Login Test ===\n');

    // Step 1: Check if we have mentors
    console.log('Step 1: Checking for approved mentors...');
    try {
        const mentorsResponse = await fetch(`${API_BASE_URL}/community/admin/mentors/pending`);
        const mentorsData = await mentorsResponse.json();

        if (mentorsData.success && mentorsData.data.length > 0) {
            console.log(`Found ${mentorsData.data.length} mentors\n`);

            // Show first approved mentor
            const approvedMentors = mentorsData.data.filter(m => m.isApproved && m.isActive);
            if (approvedMentors.length > 0) {
                console.log('✅ Approved Mentors:');
                approvedMentors.forEach(m => {
                    console.log(`  - ${m.name} (${m.email})`);
                });
                console.log('\nUse one of these emails to test login!\n');
                return approvedMentors[0].email;
            } else {
                console.log('⚠️  No approved mentors found.\n');
            }
        }
    } catch (error) {
        console.log('Error checking mentors:', error.message);
    }

    // Step 2: Show how to create a test mentor
    console.log('\n📝 To create a test mentor:');
    console.log('1. Go to /community-mentorship.html');
    console.log('2. Click "Become a Mentor"');
    console.log('3. Fill out the application form');
    console.log('4. Go to Admin Dashboard → Community Management → Mentorship');
    console.log('5. Approve the mentor application\n');

    console.log('OR use this API call:\n');
    console.log('POST http://localhost:3000/community/mentors/apply');
    console.log(JSON.stringify({
        name: "Test Mentor",
        email: "mentor@test.edu",
        university: "Test University",
        degree: "MBA",
        country: "USA",
        loanBank: "Test Bank",
        loanAmount: "$50,000",
        bio: "Experienced mentor helping students with loan applications",
        expertise: ["Loan Application", "University Selection", "Financial Planning"]
    }, null, 2));
    console.log('\nThen approve it via admin panel.\n');
}

async function quickCreateTestMentor() {
    console.log('Creating test mentor...\n');

    try {
        const response = await fetch(`${API_BASE_URL}/community/mentors/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: "Test Mentor",
                email: "testmentor@university.edu",
                phone: "+1234567890",
                university: "Test University",
                degree: "MBA",
                country: "USA",
                loanBank: "Test Bank",
                loanAmount: "$50,000",
                bio: "Experienced mentor helping students navigate loan applications",
                expertise: ["Loan Application", "University Selection", "Financial Planning"],
                linkedIn: "https://linkedin.com/in/testmentor"
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Mentor application created!');
            console.log('Email:', data.data.email);
            console.log('ID:', data.data.id);
            console.log('\n⚠️  Now you need to APPROVE this mentor via admin panel:');
            console.log('1. Go to /admin-dashboard.html');
            console.log('2. Navigate to Community Management → Mentorship');
            console.log('3. Find and approve "Test Mentor"');
            console.log('4. Then try logging in with: testmentor@university.edu\n');
        } else {
            console.log('❌ Error:', data.message);
        }
    } catch (error) {
        console.error('Error creating mentor:', error);
    }
}

// Run the tests
testMentorOTPFlow();

// Uncomment to create a test mentor:
// quickCreateTestMentor();
