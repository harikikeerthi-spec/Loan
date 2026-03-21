const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding blogs and discussions...');

    // 1. Get or create a sample user to act as the author
    // Let's create an "Expert Advisor" user
    let author = await prisma.user.findFirst({
        where: { email: 'expert@vidhyaloans.com' }
    });

    if (!author) {
        author = await prisma.user.create({
            data: {
                email: 'expert@vidhyaloans.com',
                firstName: 'Vidhya',
                lastName: 'Expert',
                mobile: '+919876543210',
                password: 'hashed_password_placeholder', // Dummy password
                role: 'admin',
            }
        });
        console.log('Created new author user:', author.email);
    } else {
        console.log('Using existing author user:', author.email);
    }

    // 2. Create some Blogs
    const blogsData = [
        {
            title: 'How to Secure an Education Loan Without Collateral in 2026',
            slug: 'how-to-secure-education-loan-without-collateral-2026',
            excerpt: 'Struggling to find collateral for your study abroad dream? Discover the top lenders offering non-collateral loans up to ₹50 Lakhs.',
            content: '<p>The dream of studying abroad is often hindered by the massive financial requirements. Historically, banks required physical property or huge fixed deposits as collateral. However, the scenario has completely changed in 2026.</p><h2>Top Lenders for Non-Collateral Loans</h2><p>Institutions like IDFC First Bank and HDFC Credila now offer unsecured loans based entirely on the academic profile of the student and the co-applicants income. If you have an admit from a STEM program in the US or UK, getting up to ₹50 Lakhs unsecured is standard.</p><p>Always remember to check the processing fees and the margin money requirements before finalizing your lender.</p>',
            category: 'Education Loans',
            authorId: author.id,
            authorName: 'Aditya Mathur',
            authorRole: 'Senior Financial Advisor',
            authorImage: 'https://ui-avatars.com/api/?name=Aditya+Mathur&background=6605c7&color=fff',
            featuredImage: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=800&q=80',
            status: 'published',
            visibility: 'public',
            isPublished: true,
            publishedAt: new Date(),
        },
        {
            title: 'US vs UK: Where Should You Pursue Your Masters?',
            slug: 'usa-vs-uk-masters-comparison',
            excerpt: 'A comprehensive comparison of the US and the UK for Indian students regarding post-study work visas, ROI, and job opportunities.',
            content: '<p>Choosing between the US and the UK for your masters is the classic dilemma for international students.</p><h2>The US Advantage</h2><p>The US remains the tech hub of the world. With STEM OPT, students get up to 3 years of post-study work rights. The ROI for Computer Science or Data Science is unmatched.</p><h2>The UK Advantage</h2><p>The UK offers a 1-year intensive masters degree, meaning you enter the job market faster and spend less on tuition overall. The 2-year Graduate Route visa is an excellent buffer for finding sponsorship.</p><h2>Conclusion</h2><p>If your budget is tight and you want a quicker turnaround, the UK is great. If you are looking for long-term settlement and top dollar salaries, the US is still the king.</p>',
            category: 'Study Abroad',
            authorId: author.id,
            authorName: 'Priya Sharma',
            authorRole: 'Study Abroad Counselor',
            authorImage: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=059669&color=fff',
            featuredImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
            status: 'published',
            visibility: 'public',
            isPublished: true,
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        }
    ];

    for (const b of blogsData) {
        const existing = await prisma.blog.findUnique({ where: { slug: b.slug } });
        if (!existing) {
            await prisma.blog.create({ data: b });
            console.log('Created blog:', b.title);
        }
    }

    // 3. Create some Forum Discussions
    const forumPostsData = [
        {
            title: 'Current wait times for US F-1 Visa slots in India?',
            excerpt: 'Are people still seeing 300+ days wait times for F-1 visa slots? Need advice for Fall 2026.',
            content: 'Hi everyone, I just got my I-20 from NEU. When I log in to the portal, the earliest available slot for the regular F-1 visa is showing as November 2026. My program starts in August! Are there any bulk slots opening up soon? Has anyone successfully used an emergency request?',
            category: 'visas',
            tags: ['US Visa', 'Fall 2026', 'F1', 'Wait Times'],
            authorId: author.id,
            views: 1420,
            likes: 45,
        },
        {
            title: 'HDFC Credila vs Avanse: Which one should I choose?',
            excerpt: 'I got sanctions from both Credila and Avanse for 40 Lakhs unsecured. Which is better?',
            content: 'I have an unsecured loan sanction for ₹40L from both lenders for my MS in Germany. Credila is offering 10.75% with a 1.25% processing fee. Avanse is offering 10.99% but just a flat ₹20K processing fee. Which one usually has a faster disbursement process and better customer service post-disbursement? Thanks!',
            category: 'loans',
            tags: ['Non-Collateral', 'HDFC Credila', 'Avanse', 'Interest Rates'],
            authorId: author.id,
            views: 890,
            likes: 32,
        },
        {
            title: 'Germany Blocked Account: Coracle vs Expatrio?',
            excerpt: 'Need to open a blocked account for German Student Visa. Any recommendations?',
            content: 'Both Coracle and Expatrio seem to offer quick blocked account creation with health insurance bundles. Expatrio seems more popular but Coracle is slightly cheaper. Has anyone faced issues with either during the Visa interview at VFS?',
            category: 'universities',
            tags: ['Germany', 'Blocked Account', 'Coracle', 'Expatrio'],
            authorId: author.id,
            views: 512,
            likes: 18,
        }
    ];

    for (const post of forumPostsData) {
        // Check if it exists by title
        const existing = await prisma.forumPost.findFirst({ where: { title: post.title } });
        if (!existing) {
            const p = await prisma.forumPost.create({ data: post });

            // Add a dummy comment to make it look alive!
            await prisma.forumComment.create({
                data: {
                    postId: p.id,
                    authorId: author.id,
                    content: 'Usually the consulates open bulk slots around May and June specifically for Fall intake students. Just keep paying the fee and keep an eye on telegram groups. Do not panic!',
                }
            });

            console.log('Created forum post:', post.title);
        }
    }

    console.log('Seeding complete!');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
