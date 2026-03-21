const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            include: {
                onboardingApplication: true,
                studyPreference: true,
                academicProfile: true,
                financialProfile: true
            }
        });

        if (!user) {
            console.log('No user found.');
            return;
        }

        console.log('--- USER DATA SNAPSHOT ---');
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.firstName} ${user.lastName}`);
        console.log('\n--- LEAD INFO ---');
        console.log(user.onboardingApplication ? JSON.stringify(user.onboardingApplication, null, 2) : 'None');
        console.log('\n--- STUDY PREFERENCES ---');
        console.log(user.studyPreference ? JSON.stringify(user.studyPreference, null, 2) : 'None');
        console.log('\n--- ACADEMIC PROFILE ---');
        console.log(user.academicProfile ? JSON.stringify(user.academicProfile, null, 2) : 'None');
        console.log('\n--- FINANCIAL PROFILE ---');
        console.log(user.financialProfile ? JSON.stringify(user.financialProfile, null, 2) : 'None');
        console.log('--------------------------');
    } catch (e) {
        console.error('Error fetching user details:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
