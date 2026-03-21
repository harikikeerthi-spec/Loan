const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const extraBlogs = [
    {
        title: 'How to Manage Your Finances as an International Student',
        slug: 'manage-finances-international-student',
        excerpt: 'Budgeting, banking, and saving tips for students living abroad.',
        content: 'Full content about managing finances...',
        category: 'Tips & Guides',
        authorName: 'Finance Pro',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Choosing Between CAD and USD for Your Masters',
        slug: 'choosing-between-cad-and-usd',
        excerpt: 'Which currency should you prefer for your education loan?',
        content: 'Full content about currency choice...',
        category: 'Education Loans',
        authorName: 'Currency Expert',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Top 10 Universities in Germany for Engineering',
        slug: 'top-10-universities-germany-engineering',
        excerpt: 'The best schools for engineering in Germany.',
        content: 'Full content about German universities...',
        category: 'Study Abroad',
        authorName: 'Edu Counsel',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Securing a Research Assistantship in Canada',
        slug: 'securing-research-assistantship-canada',
        excerpt: 'How to get a RA position to fund your studies.',
        content: 'Full content about RA positions...',
        category: 'Success Stories',
        authorName: 'RA Student',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'VidhyaLoan: Revolutionizing Education Financing',
        slug: 'vidhyaloan-revolutionizing-education-financing',
        excerpt: 'How we help students achieve their dreams.',
        content: 'Full content about VidhyaLoan...',
        category: 'News & Updates',
        authorName: 'Team VidhyaLoan',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Latest Changes in UK Student Visa Rules 2026',
        slug: 'uk-student-visa-rules-2026',
        excerpt: 'Stay updated with the newest visa regulations.',
        content: 'Full content about UK visa updates...',
        category: 'News & Updates',
        authorName: 'Visa Expert',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Packing List for Study Abroad: Essentials Only',
        slug: 'packing-list-study-abroad-essentials',
        excerpt: 'Don\'t overpack! Here is what you really need.',
        content: 'Full content about packing...',
        category: 'Tips & Guides',
        authorName: 'Global Traveler',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Student Life in Melbourne: What to Expect',
        slug: 'student-life-melbourne-expectations',
        excerpt: 'A guide to living and studying in Melbourne.',
        content: 'Full content about Melbourne...',
        category: 'Student Life',
        authorName: 'Melbourne Student',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Comparison of SBI vs Bank of Baroda Education Loans',
        slug: 'sbi-vs-bob-education-loan-comparison',
        excerpt: 'Which public sector bank is better for you?',
        content: 'Full content comparing SBI and BOB...',
        category: 'Education Loans',
        authorName: 'Finance Analyst',
        isPublished: true,
        publishedAt: new Date()
    },
    {
        title: 'Why I Chose Ireland for my Data Science Masters',
        slug: 'why-i-chose-ireland-data-science',
        excerpt: 'The booming tech scene and friendly culture of Ireland.',
        content: 'Full content about Ireland...',
        category: 'Success Stories',
        authorName: 'Data Scientist',
        isPublished: true,
        publishedAt: new Date()
    }
];

async function main() {
    console.log('Starting extra blogs seeding...');
    for (const blog of extraBlogs) {
        try {
            await prisma.blog.upsert({
                where: { slug: blog.slug },
                update: blog,
                create: blog
            });
            console.log(`Upserted: ${blog.title}`);
        } catch (e) {
            console.error(`Error upserting ${blog.title}:`, e);
        }
    }
    console.log('Seeding finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
