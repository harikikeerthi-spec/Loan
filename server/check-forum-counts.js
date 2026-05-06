
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const forumPosts = await prisma.forumPost.count();
    console.log(`Forum Posts Total: ${forumPosts}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
