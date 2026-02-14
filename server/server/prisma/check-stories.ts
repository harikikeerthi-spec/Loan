import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStories() {
    const total = await prisma.successStory.count();
    const approved = await prisma.successStory.count({ where: { isApproved: true } });
    const featured = await prisma.successStory.count({ where: { isFeatured: true } });

    console.log(`Total Success Stories: ${total}`);
    console.log(`Approved Stories: ${approved}`);
    console.log(`Featured Stories: ${featured}`);

    const stories = await prisma.successStory.findMany({
        select: { name: true, isApproved: true, isFeatured: true }
    });
    console.log('Stories:', JSON.stringify(stories, null, 2));

    await prisma.$disconnect();
}

checkStories().catch(e => {
    console.error(e);
    process.exit(1);
});
