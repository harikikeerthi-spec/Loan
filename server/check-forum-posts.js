const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.forumPost.count();
        console.log(`Total Forum Posts: ${count}`);

        const posts = await prisma.forumPost.findMany({
            include: {
                author: {
                    select: { email: true, firstName: true }
                }
            }
        });

        console.log(JSON.stringify(posts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
