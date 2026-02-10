const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.forumPost.groupBy({
            by: ['category'],
            _count: {
                category: true
            }
        });

        console.log('--- DB CATEGORIES ---');
        categories.forEach(c => {
            console.log(`${c.category}: ${c._count.category} posts`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
