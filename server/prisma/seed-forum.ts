import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedForum() {
    console.log('🌱 Seeding forum data...');

    // Get a user to be the author (or create one if none exists)
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'testuser@example.com',
                password: 'password123',
                mobile: '1234567890',
                firstName: 'Test',
                lastName: 'User',
            },
        });
    }

    // Clean up existing forum data
    await prisma.forumComment.deleteMany();
    await prisma.forumPost.deleteMany();

    const posts = await Promise.all([
        prisma.forumPost.create({
            data: {
                authorId: user.id,
                title: 'How to choose between HDFC and SBI for education loans?',
                content: 'I have offers from both banks for my MS in US. HDFC is offering 9.5% non-collateral, while SBI is 8.25% with collateral. Which one should I go for?',
                category: 'Loans',
                tags: ['HDFC', 'SBI', 'Comparison'],
                views: 124,
                likes: 12,
            },
        }),
        prisma.forumPost.create({
            data: {
                authorId: user.id,
                title: 'Visa interview experience at Hyderabad Consulate',
                content: 'Just finished my F1 visa interview. It was quite smooth. They asked about my funding and why I chose this specific university. Total time inside was 2 hours.',
                category: 'Visa',
                tags: ['F1', 'Interview', 'Hyderabad'],
                views: 450,
                likes: 45,
            },
        }),
        prisma.forumPost.create({
            data: {
                authorId: user.id,
                title: 'Top universities for Data Science in Canada',
                content: 'I am looking for MS in Data Science programs in Canada for Fall 2026. So far I have shortlisted Toronto, UBC, and Waterloo. Any other suggestions?',
                category: 'Admissions',
                tags: ['Canada', 'Data Science', 'Admissions'],
                views: 230,
                likes: 18,
            },
        }),
    ]);

    // Add some comments
    await prisma.forumComment.create({
        data: {
            postId: posts[0].id,
            authorId: user.id,
            content: 'If you have collateral, SBI is much better due to the lower interest rate over 10 years.',
        },
    });

    console.log(`✅ Created ${posts.length} forum posts`);
    console.log('✨ Forum data seeding completed!');
}

async function main() {
    try {
        await seedForum();
    } catch (error) {
        console.error('❌ Error seeding forum data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
