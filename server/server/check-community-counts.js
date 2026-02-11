
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mentorsTotal = await prisma.mentor.count();
    const mentorsApproved = await prisma.mentor.count({ where: { isApproved: true } });
    const mentorsPending = await prisma.mentor.count({ where: { isApproved: false } });

    const storiesTotal = await prisma.successStory.count();
    const storiesApproved = await prisma.successStory.count({ where: { isApproved: true } });
    const storiesPending = await prisma.successStory.count({ where: { isApproved: false } });

    const eventsTotal = await prisma.communityEvent.count();
    const resourcesTotal = await prisma.communityResource.count();

    const bookingsTotal = await prisma.mentorBooking.count();
    const registrationsTotal = await prisma.eventRegistration.count();

    console.log('--- MENTOR STATS ---');
    console.log(`Total: ${mentorsTotal}`);
    console.log(`Approved: ${mentorsApproved}`);
    console.log(`Pending: ${mentorsPending}`);

    console.log('--- STORY STATS ---');
    console.log(`Total: ${storiesTotal}`);
    console.log(`Approved: ${storiesApproved}`);
    console.log(`Pending: ${storiesPending}`);

    console.log('--- OTHER STATS ---');
    console.log(`Events Total: ${eventsTotal}`);
    console.log(`Resources Total: ${resourcesTotal}`);
    console.log(`Bookings Total: ${bookingsTotal}`);
    console.log(`Registrations Total: ${registrationsTotal}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
