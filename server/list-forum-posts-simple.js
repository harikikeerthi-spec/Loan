const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const posts = await prisma.forumPost.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                title: true,
                category: true,
                isMentorOnly: true,
                _count: {
                    select: { comments: true }
                }
            }
        });

        console.log(`\n\n=== TOTAL FORUM POSTS: ${posts.length} ===\n`);

        posts.forEach(p => {
            console.log(`• TITLE: ${p.title}`);
            console.log(`  CATEGORY: ${p.category}`);
            console.log(`  MENTOR ONLY: ${p.isMentorOnly ? 'YES' : 'No'}`);
            console.log(`  COMMENTS: ${p._count.comments}`);
            console.log('----------------------------------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
