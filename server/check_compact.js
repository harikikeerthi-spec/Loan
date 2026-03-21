const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            email: true,
            firstName: true,
            goal: true,
            studyDestination: true,
            courseName: true,
            gpa: true,
            createdAt: true,
        }
    });

    console.log('--- DB SNAPSHOT ---');
    users.forEach((u, i) => {
        console.log(`[${i + 1}] ${u.email} | ${u.firstName || 'NoName'} | Goal: ${u.goal || 'None'} | Dest: ${u.studyDestination || 'None'} | GPA: ${u.gpa || 'None'}`);
    });
    console.log('--- END ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
