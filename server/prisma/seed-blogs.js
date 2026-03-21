const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding blogs...');

    const blogs = [
        {
            title: 'Top 5 Universities for Computer Science in 2026',
            slug: 'top-5-cs-universities-2026',
            excerpt: 'Discover the best institutions for pursuing a CS degree abroad with scholarship opportunities.',
            content: '<h2>Introduction</h2><p>Choosing the right university is crucial...</p><h2>1. MIT</h2><p>...</p>',
            category: 'Study Abroad',
            authorName: 'Sarah Jenkins',
            featuredImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            readTime: 6,
            views: 1250,
            featured: true,
            published: true,
            publishedAt: new Date(),
        },
        {
            title: 'How to Write a Winning SOP',
            slug: 'how-to-write-winning-sop',
            excerpt: 'A comprehensive guide to crafting a Statement of Purpose that gets you admitted.',
            content: '<h2>What is an SOP?</h2><p>Your statement of purpose...</p>',
            category: 'Guides',
            authorName: 'Dr. A. Kumar',
            featuredImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            readTime: 8,
            views: 890,
            featured: false,
            published: true,
            publishedAt: new Date(),
        },
        {
            title: 'Understanding Education Loans: Fixed vs Floating Rates',
            slug: 'education-loans-fixed-vs-floating',
            excerpt: 'Navigate the complex world of student loans and choose the best interest rate for you.',
            content: '<h2>Interest Rates Explained</h2><p>When applying for an education loan...</p>',
            category: 'Finance',
            authorName: 'Rajiv Mehta',
            featuredImage: 'https://images.unsplash.com/photo-1554224155-9736d53d1d84?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            readTime: 5,
            views: 450,
            featured: false,
            published: true,
            publishedAt: new Date(),
        },
    ];

    for (const blog of blogs) {
        const exists = await prisma.blog.findUnique({ where: { slug: blog.slug } });
        if (!exists) {
            await prisma.blog.create({ data: blog });
            console.log(`Created blog: ${blog.title}`);
        } else {
            console.log(`Skipping existing blog: ${blog.title}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
