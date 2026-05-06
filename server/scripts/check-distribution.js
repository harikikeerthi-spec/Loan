const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDistribution() {
    console.log('--- Category Distribution ---');

    const mentors = await prisma.mentor.groupBy({
        by: ['category'],
        _count: true
    });
    console.log('\nMentors by Category:', mentors);

    const resources = await prisma.communityResource.groupBy({
        by: ['category'],
        _count: true
    });
    console.log('\nResources by Category:', resources);

    const events = await prisma.communityEvent.groupBy({
        by: ['category'],
        _count: true
    });
    console.log('\nEvents by Category:', events);

    const posts = await prisma.forumPost.groupBy({
        by: ['category'],
        _count: true
    });
    console.log('\nForum Posts by Category:', posts);

    await prisma.$disconnect();
}

checkDistribution();
