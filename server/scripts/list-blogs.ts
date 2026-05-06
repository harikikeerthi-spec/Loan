import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listBlogs() {
    try {
        const blogs = await prisma.blog.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                isPublished: true,
                views: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(`\n📚 Total Blogs in Database: ${blogs.length}\n`);

        if (blogs.length === 0) {
            console.log('❌ No blogs found. The database is empty.');
            console.log('\nTo create sample blogs, run:');
            console.log('  npx tsx scripts/create-sample-blogs.ts\n');
        } else {
            console.log('Blogs:');
            console.log('---------------------------------------------------');
            blogs.forEach((blog, index) => {
                console.log(`${index + 1}. ${blog.title}`);
                console.log(`   ID: ${blog.id}`);
                console.log(`   Slug: ${blog.slug}`);
                console.log(`   Status: ${blog.isPublished ? '✅ Published' : '📝 Draft'}`);
                console.log(`   Views: ${blog.views}`);
                console.log('---------------------------------------------------');
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listBlogs();
