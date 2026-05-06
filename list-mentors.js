// Simple script to list all approved mentors
const API_BASE_URL = 'http://localhost:3000/community';

async function listApprovedMentors() {
    try {
        const response = await fetch(`${API_BASE_URL}/mentors`);
        const data = await response.json();

        console.log('\n=== Approved & Active Mentors ===\n');

        if (data.success && data.data.length > 0) {
            console.log(`Found ${data.data.length} mentors:\n`);
            data.data.forEach((mentor, index) => {
                console.log(`${index + 1}. ${mentor.name}`);
                console.log(`   Email: ${mentor.email}`);
                console.log(`   University: ${mentor.university}`);
                console.log(`   Status: ${mentor.isApproved ? '✅ Approved' : '⏳ Pending'} ${mentor.isActive ? '& Active' : '& Inactive'}`);
                console.log('');
            });

            console.log('✅ Use any of the emails above to test OTP login!\n');
            console.log('📝 Go to /mentor-login.html and enter the email\n');
        } else {
            console.log('❌ No approved mentors found in the database.\n');
            console.log('To create a test mentor:');
            console.log('1. Go to /community-mentorship.html');
            console.log('2. Scroll down and click "Become a Mentor"');
            console.log('3. Fill the form and submit');
            console.log('4. Go to Admin Dashboard and approve the mentor\n');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listApprovedMentors();
