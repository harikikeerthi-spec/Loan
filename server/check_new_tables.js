const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const onboardCount = await prisma.onboardingApplication.count();
        const studyCount = await prisma.userStudyPreference.count();
        const academicCount = await prisma.userAcademicProfile.count();
        const financialCount = await prisma.userFinancialProfile.count();
        const userCount = await prisma.user.count();

        console.log('--- DB TABLE STATUS ---');
        console.log(`Users: ${userCount}`);
        console.log(`Onboarding Leads: ${onboardCount}`);
        console.log(`Study Preferences: ${studyCount}`);
        console.log(`Academic Profiles: ${academicCount}`);
        console.log(`Financial Profiles: ${financialCount}`);
        console.log('-----------------------');
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
