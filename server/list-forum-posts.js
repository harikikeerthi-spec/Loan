const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const posts = await prisma.forumPost.findMany({
            select: {
                id: true,
                title: true,
                category: true,
                isMentorOnly: true,
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: { comments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('--- FORUM POSTS ---');
        console.table(posts.map(p => ({
            ID: p.id.substring(0, 8) + '...',
            Title: p.title.substring(0, 40) + (p.title.length > 40 ? '...' : ''),
            Category: p.category,
            Author: `${p.author.firstName} ${p.author.lastName}`,
            'Mentor Only': p.isMentorOnly,
            Comments: p._count.comments
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
