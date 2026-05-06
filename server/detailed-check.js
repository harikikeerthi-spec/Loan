
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inactiveMentors = await prisma.mentor.count({ where: { isActive: false } });
    const pendingMentors = await prisma.mentor.count({ where: { isApproved: false } });
    const unapprovedStories = await prisma.successStory.count({ where: { isApproved: false } });
    const allResources = await prisma.communityResource.count();
    const allEvents = await prisma.communityEvent.count();

    console.log('--- DETAILED CHECK ---');
    console.log(`Inactive Mentors: ${inactiveMentors}`);
    console.log(`Pending Mentors: ${pendingMentors}`);
    console.log(`Unapproved Stories: ${unapprovedStories}`);
    console.log(`Resources Total: ${allResources}`);
    console.log(`Events Total: ${allEvents}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
