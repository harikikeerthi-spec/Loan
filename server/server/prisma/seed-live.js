const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING COMPREHENSIVE SEED ---');

    // 1. Create/Ensure User exists (required author for forum posts)
    console.log('Seeding user...');
    const email = 'chinnu2341@gmail.com';
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            firstName: 'Chinnu',
            lastName: 'Chinnu',
            mobile: '9876543210',
            password: 'hashed_password_placeholder', // You'll want to hash this in production
            role: 'user',
            goal: 'loan',
            studyDestination: 'Germany',
            courseName: 'Data Science'
        }
    });
    console.log(`User ${user.email} is ready.`);

    // 2. Seed Blogs
    console.log('Seeding blogs...');
    const sampleBlogs = [
        {
            title: 'Complete Guide to Education Loans in 2026',
            slug: 'complete-guide-education-loans-2026',
            excerpt: 'Navigating the application process for education loans.',
            content: '<h2>Introduction</h2><p>Education loans are a vital tool...</p>',
            category: 'Education Loans',
            authorName: 'Rajesh Kumar',
            authorRole: 'Senior Financial Advisor',
            readTime: 8,
            isFeatured: true,
            isPublished: true,
            publishedAt: new Date('2026-01-15'),
            status: 'published',
            visibility: 'public'
        },
        {
            title: 'Top 10 Countries for International Students in 2026',
            slug: 'top-10-countries-international-students-2026',
            excerpt: 'Discover the best destinations for your international journey.',
            content: '<h2>Choosing the right country...</h2><p>USA, UK, Canada, Australia...</p>',
            category: 'Study Abroad',
            authorName: 'Priya Sharma',
            authorRole: 'Education Consultant',
            readTime: 6,
            isFeatured: false,
            isPublished: true,
            publishedAt: new Date('2026-01-10'),
            status: 'published',
            visibility: 'public'
        }
    ];

    for (const blog of sampleBlogs) {
        await prisma.blog.upsert({
            where: { slug: blog.slug },
            update: blog,
            create: blog
        });
        console.log(`- Blog: ${blog.title}`);
    }

    // 3. Seed Forum Posts
    console.log('Seeding forum posts...');
    const forumPosts = [
        {
            title: "Best banks for education loans without collateral?",
            content: "I'm looking for banks that offer education loans up to 40 Lakhs without collateral for MS in US. Any suggestions?",
            category: "loan",
            tags: ["finance", "collateral-free"],
            authorId: user.id,
            likes: 15,
            views: 120
        },
        {
            title: "US F1 Visa interview experience at Mumbai Consulate",
            content: "Just had my visa interview today. Here are the questions asked: 1. Why this university? 2. Who is sponsoring you? ... Approved!",
            category: "visa",
            tags: ["visa-interview", "usa"],
            authorId: user.id,
            likes: 45,
            views: 350
        },
        {
            title: "Scholarships for Indian Students in UK 2026",
            content: "Compiling a list of scholarships available for Indian students applying to UK universities. Please add if you know any.",
            category: "scholarships",
            tags: ["funding", "uk"],
            authorId: user.id,
            likes: 67,
            views: 500
        }
    ];

    for (const post of forumPosts) {
        const existingPost = await prisma.forumPost.findFirst({
            where: { title: post.title }
        });
        if (!existingPost) {
            await prisma.forumPost.create({ data: post });
            console.log(`- Forum Post: ${post.title}`);
        } else {
            console.log(`- Forum Post already exists: ${post.title}`);
        }
    }

    console.log('--- SEEDING COMPLETED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
