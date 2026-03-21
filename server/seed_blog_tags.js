
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding tags for all blogs...');

    // Define some common tags
    const commonTags = [
        { name: 'finance', slug: 'finance' },
        { name: 'study-abroad', slug: 'study-abroad' },
        { name: 'education-loans', slug: 'education-loans' },
        { name: 'budgeting', slug: 'budgeting' },
        { name: 'success-stories', slug: 'success-stories' },
        { name: 'financial-management', slug: 'financial-management' },
        { name: 'student-life', slug: 'student-life' },
        { name: 'visa-guide', slug: 'visa-guide' }
    ];

    // Create tags if they don't exist
    for (const tagData of commonTags) {
        await prisma.tag.upsert({
            where: { name: tagData.name },
            update: {},
            create: tagData
        });
    }
    console.log('Common tags ensured.');

    // Fetch all blogs
    const blogs = await prisma.blog.findMany();

    for (const blog of blogs) {
        // Clear existing tags for clean re-seeding if necessary
        await prisma.blogTag.deleteMany({
            where: { blogId: blog.id }
        });

        let tagsToAssign = [];

        // Assign tags based on category or content
        if (blog.category === 'Financial Tips') {
            tagsToAssign.push('finance', 'budgeting', 'financial-management');
        } else if (blog.category === 'Education Loans') {
            tagsToAssign.push('education-loans', 'finance');
        } else if (blog.category === 'Study Abroad') {
            tagsToAssign.push('study-abroad', 'student-life');
        } else if (blog.category === 'Success Stories') {
            tagsToAssign.push('success-stories', 'student-life');
        }

        // Specific tag requested by user: "Managing Your Finance while studying abroad"
        // Let's create this specific tag
        const userTag = { name: 'Managing Your Finance while studying abroad', slug: 'managing-finance-abroad' };
        await prisma.tag.upsert({
            where: { name: userTag.name },
            update: {},
            create: userTag
        });

        // Add the user requested tag if relevant
        if (blog.category === 'Financial Tips' || blog.slug.includes('money') || blog.slug.includes('finance')) {
            tagsToAssign.push(userTag.name);
        }

        // Add some variety
        if (blog.readTime > 6) tagsToAssign.push('detailed-guide');

        // Final deduplication
        tagsToAssign = [...new Set(tagsToAssign)];

        for (const tagName of tagsToAssign) {
            const tag = await prisma.tag.findUnique({ where: { name: tagName } });
            if (!tag) {
                // Ensure the extra tags like 'detailed-guide' exist
                const newTag = await prisma.tag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: { name: tagName, slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
                });
                await prisma.blogTag.create({
                    data: { blogId: blog.id, tagId: newTag.id }
                });
            } else {
                await prisma.blogTag.create({
                    data: { blogId: blog.id, tagId: tag.id }
                });
            }
        }
        console.log(`Assigned tags to blog: ${blog.title}`);
    }

    console.log('Tag seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
