const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompact() {
    const user = await prisma.user.findFirst({
        include: {
            onboardingApplication: true,
            studyPreference: true,
            academicProfile: true,
            financialProfile: true
        }
    });

    if (!user) return console.log('No user.');

    console.log(`\n--- FINAL DB CHECK: ${user.email} ---`);
    console.log(`[USER] Goal: ${user.goal}, WorkExp: ${user.workExp}, GPA: ${user.gpa}`);
    console.log(`[LEAD] Name: ${user.onboardingApplication?.fullName}, Status: ${user.onboardingApplication?.status}`);
    console.log(`[STUDY] Country: ${user.studyPreference?.studyDestination}, Uni: ${user.studyPreference?.targetUniversity}`);
    console.log(`[ACADEMIC] Degree: ${user.academicProfile?.bachelorsDegree}, Test: ${user.academicProfile?.entranceScore}`);
    console.log(`[FINANCIAL] Budget: ${user.financialProfile?.budget}, Loan: ${user.financialProfile?.loanAmount}`);
    console.log('-------------------------------------------\n');
    await prisma.$disconnect();
}

checkCompact();
