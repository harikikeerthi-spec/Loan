const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = ['loan', 'visa', 'universities', 'gre', 'accommodation', 'general', 'scholarships', 'jobs'];
const tagsPool = ['urgent', 'help needed', 'success story', 'advice', 'review', 'application', 'documentation', 'interview', 'funding', 'study abroad'];

const samplePosts = [
    {
        title: "Best banks for education loans without collateral?",
        excerpt: "Which banks lend large education loans without collateral — quick comparison.",
        content: "I'm looking for banks that offer education loans up to 40 Lakhs without collateral for MS in US. Any suggestions?",
        category: "loan",
        tags: ["finance", "collateral-free"],
        likes: 15,
        views: 120
    },
    {
        title: "US F1 Visa interview experience at Mumbai Consulate",
        excerpt: "Real interview questions and tips from a recent F1 interview at Mumbai.",
        content: "Just had my visa interview today. Here are the questions asked: 1. Why this university? 2. Who is sponsoring you? ... Approved!",
        category: "visa",
        tags: ["visa-interview", "usa"],
        likes: 45,
        views: 350
    },
    {
        title: "Profile Evaluation for Fall 2026 - CS Major",
        excerpt: "Quick profile summary and target university fit for MS in CS.",
        content: "GRE: 325, IELTS: 8.0, GPA: 8.5/10. Work exp: 2 years. Target universities: NEU, ASU, UTD. Are these safe or ambitious?",
        category: "universities",
        tags: ["profile-evaluation", "ms-in-cs"],
        likes: 8,
        views: 95
    },
    {
        title: "Accommodation near Northeastern University Boston?",
        excerpt: "Looking for shared housing options near campus within a budget.",
        content: "Looking for shared accommodation near NEU. Budget around $800-1000 per month. Any leads?",
        category: "accommodation",
        tags: ["boston", "housing"],
        likes: 3,
        views: 40
    },
    {
        title: "How to prepare for GRE Verbal section?",
        excerpt: "Best study resources and strategies to improve GRE Verbal quickly.",
        content: "Struggling with vocabulary. Which word lists are the best? Magoosh vs Manhattan?",
        category: "gre",
        tags: ["exam-prep", "verbal"],
        likes: 12,
        views: 88
    },
    {
        title: "Scholarships for Indian Students in UK",
        excerpt: "Overview of scholarships and application tips for Indian applicants.",
        content: "Compiling a list of scholarships available for Indian students applying to UK universities. Please add if you know any.",
        category: "scholarships",
        tags: ["funding", "uk"],
        likes: 67,
        views: 500
    },
    {
        title: "Part-time job opportunities in Canada for students",
        excerpt: "Common part-time roles and how to find them in Toronto.",
        content: "What are the common PT jobs available? How easy is it to find one in Toronto?",
        category: "jobs",
        tags: ["canada", "work"],
        likes: 22,
        views: 150
    },
    {
        title: "Loan messed up my credit score? Help!",
        excerpt: "Will a past missed payment affect future education loan approvals?",
        content: "I took a small loan previously and missed one payment. Will this affect my education loan approval?",
        category: "loan",
        tags: ["credit-score", "urgent"],
        likes: 5,
        views: 60
    },
    {
        title: "SOP Review for Data Science programs",
        excerpt: "Request for SOP review — willing to share draft for feedback.",
        content: "Can someone review my Statement of Purpose? I can DM the draft.",
        category: "general",
        tags: ["sop", "review"],
        likes: 9,
        views: 75
    },
    {
        title: "Is it worth doing MS in 2026 given the job market?",
        excerpt: "Discussion on ROI and timing for pursuing MS in the current market.",
        content: "With the current recession fears, is it a good idea to invest in an MS right now?",
        category: "general",
        tags: ["career-advice", "discussion"],
        likes: 30,
        views: 210
    }
];

async function main() {
    console.log('Start seeding forum posts...');

    // Get the first user to be the author
    const user = await prisma.user.findFirst();

    if (!user) {
        console.error('No users found in database. Please create a user first.');
        return;
    }

    console.log(`Using user ${user.id} (${user.email}) as author.`);

    // Delete existing forum posts (optional, but good for clean state testing if desired)
    // await prisma.forumPost.deleteMany({}); 
    // console.log('Cleared existing forum posts.');

    for (const post of samplePosts) {
        await prisma.forumPost.create({
            data: {
                title: post.title,
                content: post.content,
                category: post.category,
                tags: post.tags,
                authorId: user.id,
                likes: post.likes,
                views: post.views,
                isMentorOnly: false,
                // Add some random comments maybe later
            }
        });
        console.log(`Created post: ${post.title}`);
    }

    // Add a mentor-only post
    await prisma.forumPost.create({
        data: {
            title: "Mentor Exclusive: Advanced Career Strategies",
            content: "This content is visible to mentors only.",
            category: "general",
            tags: ["mentor-only", "career"],
            authorId: user.id,
            likes: 10,
            views: 5,
            isMentorOnly: true
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
