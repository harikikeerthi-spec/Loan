const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUser() {
    const email = 'chinnu2341@gmail.com';
    const mobile = '9876543210';

    // Core data values
    const goal = 'loan';
    const studyDestination = 'Germany';
    const courseName = 'Data Science';
    const targetUniversity = 'University of Cologne';
    const intakeSeason = 'Fall 2026';
    const bachelorsDegree = 'B.Tech in Computer Science';
    const gpa = 9.0;
    const workExp = 9;
    const entranceTest = 'GRE';
    const entranceScore = '320';
    const englishTest = 'IELTS';
    const englishScore = '7.5';
    const budget = '25-30 Lakhs';
    const pincode = '560001';
    const loanAmount = '21 Lakhs';
    const admitStatus = 'Applied';

    try {
        console.log(`Explicitly seeding data for ${email}...`);

        // 1. User Table
        const user = await prisma.user.upsert({
            where: { email },
            create: {
                email,
                firstName: 'Chinnu',
                lastName: 'Chinnu',
                mobile,
                password: '',
                role: 'user',
                goal,
                studyDestination,
                courseName,
                targetUniversity,
                intakeSeason,
                bachelorsDegree,
                gpa,
                workExp,
                entranceTest,
                entranceScore,
                englishTest,
                englishScore,
                budget,
                pincode,
                loanAmount,
                admitStatus
            },
            update: {
                goal,
                studyDestination,
                courseName,
                targetUniversity,
                intakeSeason,
                bachelorsDegree,
                gpa,
                workExp,
                entranceTest,
                entranceScore,
                englishTest,
                englishScore,
                budget,
                pincode,
                loanAmount,
                admitStatus
            }
        });

        // 2. Lead Table
        await prisma.onboardingApplication.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                email,
                fullName: 'Chinnu Chinnu',
                phone: mobile,
                goal,
                studyDestination,
                courseName,
                targetUniversity,
                intakeSeason,
                bachelorsDegree,
                gpa,
                workExp,
                entranceTest,
                entranceScore,
                englishTest,
                englishScore,
                budget,
                pincode,
                loanAmount,
                admitStatus,
                source: 'seed_script'
            },
            update: {
                goal,
                studyDestination,
                courseName,
                targetUniversity,
                intakeSeason,
                bachelorsDegree,
                gpa,
                workExp,
                entranceTest,
                entranceScore,
                englishTest,
                englishScore,
                budget,
                pincode,
                loanAmount,
                admitStatus
            }
        });

        // 3. Study Table
        await prisma.userStudyPreference.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                goal,
                studyDestination,
                courseName,
                targetUniversity,
                intakeSeason,
                admitStatus
            },
            update: {
                goal,
                studyDestination,
                courseName,
                targetUniversity,
                intakeSeason,
                admitStatus
            }
        });

        // 4. Academic Table
        await prisma.userAcademicProfile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                bachelorsDegree,
                gpa,
                workExp,
                entranceTest,
                entranceScore,
                englishTest,
                englishScore
            },
            update: {
                bachelorsDegree,
                gpa,
                workExp,
                entranceTest,
                entranceScore,
                englishTest,
                englishScore
            }
        });

        // 5. Financial Table
        await prisma.userFinancialProfile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                budget,
                pincode,
                loanAmount
            },
            update: {
                budget,
                pincode,
                loanAmount
            }
        });

        console.log('Successfully added identical data across all 5 tables.');
    } catch (e) {
        console.error('Seed error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedUser();
