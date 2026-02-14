import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Clearing community data...');

    await prisma.forumCommentLike.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.forumComment.deleteMany();
    await prisma.forumPost.deleteMany();
    await prisma.mentorBooking.deleteMany();
    await prisma.mentor.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.communityEvent.deleteMany();
    await prisma.successStory.deleteMany();
    await prisma.communityResource.deleteMany();

    console.log('✅ Community data cleared');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
