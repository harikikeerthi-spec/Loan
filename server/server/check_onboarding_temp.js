const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            mobile: true,
            role: true,
            goal: true,
            studyDestination: true,
            courseName: true,
            targetUniversity: true,
            intakeSeason: true,
            bachelorsDegree: true,
            gpa: true,
            workExp: true,
            entranceTest: true,
            entranceScore: true,
            englishTest: true,
            englishScore: true,
            budget: true,
            pincode: true,
            loanAmount: true,
            admitStatus: true,
            createdAt: true,
        }
    });

    console.log('\n====== TOTAL USERS: ' + users.length + ' ======\n');

    users.forEach((u, i) => {
        console.log(`--- User ${i + 1} ---`);
        console.log('ID          :', u.id);
        console.log('Email       :', u.email);
        console.log('Name        :', (u.firstName || '') + ' ' + (u.lastName || ''));
        console.log('Mobile      :', u.mobile);
        console.log('Role        :', u.role);
        console.log('--- Onboarding Data ---');
        console.log('Goal        :', u.goal || '(not set)');
        console.log('Destination :', u.studyDestination || '(not set)');
        console.log('Course      :', u.courseName || '(not set)');
        console.log('University  :', u.targetUniversity || '(not set)');
        console.log('Intake      :', u.intakeSeason || '(not set)');
        console.log('Bachelors   :', u.bachelorsDegree || '(not set)');
        console.log('GPA         :', u.gpa ?? '(not set)');
        console.log('Work Exp    :', u.workExp ?? '(not set)');
        console.log('Entrance    :', u.entranceTest || '(not set)', '|', u.entranceScore || '');
        console.log('English     :', u.englishTest || '(not set)', '|', u.englishScore || '');
        console.log('Budget      :', u.budget || '(not set)');
        console.log('Pincode     :', u.pincode || '(not set)');
        console.log('Loan Amt    :', u.loanAmount || '(not set)');
        console.log('Admit Status:', u.admitStatus || '(not set)');
        console.log('Created At  :', u.createdAt);
        console.log('');
    });

    const onboardedCount = users.filter(u => u.goal).length;
    console.log('====== ONBOARDING SUMMARY ======');
    console.log('Total Users    :', users.length);
    console.log('Onboarded Users:', onboardedCount);
    console.log('Pending        :', users.length - onboardedCount);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
