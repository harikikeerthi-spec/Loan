const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding more blogs...');

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
                password: 'hashed_password_placeholder',
                role: 'admin',
            }
        });
    }

    const blogsData = [
        {
            title: 'Guide to Post-Study Work Visas: UK, US, Canada & Australia',
            slug: 'post-study-work-visa-guide-2026',
            excerpt: 'Compare the post-study work rights, visa durations, and pathways to permanent residency across the top 4 study abroad destinations.',
            content: '<p>The ultimate goal for many international students is securing a job and potentially settling in their chosen study destination. Understanding the Post-Study Work (PSW) visa regulations is crucial before you apply.</p><h2>United Kingdom (Graduate Route)</h2><p>The UK offers a 2-year Graduate Route visa for Bachelors and Masters graduates, and 3 years for PhDs. It requires no sponsorship, but transitioning to a Skilled Worker Visa requires meeting minimum salary thresholds.</p><h2>United States (OPT & STEM OPT)</h2><p>Standard OPT gives you 1 year. However, if your degree is STEM-designated, you get an additional 2 years (total 3 years). The H1-B lottery is the biggest hurdle post-OPT.</p><h2>Canada (PGWP)</h2><p>Canada’s Post-Graduation Work Permit (PGWP) is directly tied to the length of your program. A 2-year masters usually yields a 3-year PGWP. It is the clearest pathway to Permanent Residency (PR) via Express Entry.</p><h2>Australia (TGV)</h2><p>Australia recently overhauled its Temporary Graduate Visa (subclass 485). Masters by coursework students generally get 2 years, research students get 3 years. Regional study adds 1-2 extra years.</p>',
            category: 'Visas',
            authorId: author.id,
            authorName: 'Aditya Mathur',
            authorRole: 'Senior Financial Advisor',
            authorImage: 'https://ui-avatars.com/api/?name=Aditya+Mathur&background=6605c7&color=fff',
            featuredImage: 'https://images.unsplash.com/photo-1569974558509-0d2e8b6b1996?w=800&q=80', // Passport/Visa image
            status: 'published',
            visibility: 'public',
            isPublished: true,
            readTime: 6,
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        },
        {
            title: 'Top 5 Scholarships for Indian Students Pursuing MS in USA',
            slug: 'top-scholarships-indian-students-ms-usa-2026',
            excerpt: 'Don\'t let finances stop you. Explore these fully and partially funded scholarships specifically tailored for Indian applicants studying in the United States.',
            content: '<p>While the US is expensive, it is also home to some of the most generous funding opportunities in the world.</p><h2>1. Fulbright-Nehru Master’s Fellowships</h2><p>Designed for outstanding Indians to pursue a masters degree program at select US colleges. It covers tuition, living, and airfare. However, it requires you to return to India for at least two years after completion.</p><h2>2. Tata Scholarship at Cornell University</h2><p>Ratan Tata’s endowment ensures that up to 20 scholars from India are supported full-time at Cornell. Priority is given to Engineering, Architecture, and Economics.</p><h2>3. Inlaks Shivdasani Foundation Scholarships</h2><p>The foundation grants scholarships up to $100,000 to Indian citizens applying to top-tier US and UK institutions. Note: Engineering and Computer Science are usually excluded.</p><h2>4. AAUW International Fellowships</h2><p>For women who are not US citizens. Fellowships provide $18,000 to $30,000, perfect for covering living expenses during your MS.</p>',
            category: 'Scholarships',
            authorId: author.id,
            authorName: 'Priya Sharma',
            authorRole: 'Study Abroad Counselor',
            authorImage: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=059669&color=fff',
            featuredImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80', // Students graduating
            status: 'published',
            visibility: 'public',
            isPublished: true,
            readTime: 5,
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
        },
        {
            title: 'What is Margin Money in Education Loans?',
            slug: 'understanding-margin-money-education-loans',
            excerpt: 'Margin money is the percentage of your total study cost that the bank will NOT cover. Here is how to calculate it and plan your finances accordingly.',
            content: '<p>When a bank says they will fund your education limit up to ₹40 Lakhs, they usually mention a <strong>Margin Money</strong> requirement, often ranging from 0% to 15%.</p><h2>What does it mean?</h2><p>If your total cost of attendance (Tuition + Living) is ₹50 Lakhs, and the bank has a 10% margin requirement, it means the bank will only disburse 90% of the cost (₹45 Lakhs). You must prove to the bank that you have the remaining 10% (₹5 Lakhs) before they disburse their funds.</p><h2>Do all banks ask for Margin Money?</h2><p>No. Most NBFCs (Non-Banking Financial Companies) like HDFC Credila, Avanse, and Auxilo offer 100% funding (0% margin). Public sector banks (like SBI) typically require 10% to 15% margin for loans above ₹4 Lakhs.</p><h2>How to pay the margin?</h2><p>Margin money is paid pro-rata. If your first semester fee is $10,000, and your margin is 10%, you pay $1,000 directly to the university from your pocket, and the bank transfers the remaining $9,000.</p>',
            category: 'Education Loans',
            authorId: author.id,
            authorName: 'Aditya Mathur',
            authorRole: 'Senior Financial Advisor',
            authorImage: 'https://ui-avatars.com/api/?name=Aditya+Mathur&background=6605c7&color=fff',
            featuredImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80', // Calculator and money
            status: 'published',
            visibility: 'public',
            isPublished: true,
            readTime: 4,
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
        },
        {
            title: 'How to Write a Winning Statement of Purpose (SOP) for STEM Programs',
            slug: 'how-to-write-winning-sop-stem-programs',
            excerpt: 'Admissions committees read thousands of SOPs. Follow this structural formula to ensure your Statement of Purpose stands out from the crowd.',
            content: '<p>Your Statement of Purpose (SOP) is the only place in your application where you can speak directly to the admissions committee. For STEM (Science, Technology, Engineering, Mathematics) programs, precision is more important than poetry.</p><h2>1. The Hook (Paragraph 1)</h2><p>Avoid cliché quotes. Start with a specific technical problem or project that sparked your interest in this field. Show, don’t just tell.</p><h2>2. Academic & Research History (Paragraphs 2-3)</h2><p>Discuss your undergraduate coursework, but focus heavily on projects, thesis, and research. Mention what algorithms you used, what software you built, and what the concrete outcome was.</p><h2>3. Professional Experience (Paragraph 4)</h2><p>If you have work experience, explain how it bridges the gap between your undergrad and the masters program. What limitations did you face at work that a masters degree will help you overcome?</p><h2>4. Why THIS University? (Paragraph 5)</h2><p>This is crucial. Mention specific professors you want to work with. Mention specific labs (e.g., the AI Robotics Lab). Mention specific electives. This proves you have done your research.</p><h2>5. Future Goals (Paragraph 6)</h2><p>Be specific. Do not say "I want to be a software engineer." Say "I aim to work as an applied Machine Learning Engineer optimizing logistics networks."</p>',
            category: 'Study Abroad',
            authorId: author.id,
            authorName: 'Priya Sharma',
            authorRole: 'Study Abroad Counselor',
            authorImage: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=059669&color=fff',
            featuredImage: 'https://images.unsplash.com/photo-1455390582262-044cdead2708?w=800&q=80', // Writing on paper
            status: 'published',
            visibility: 'public',
            isPublished: true,
            readTime: 7,
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        }
    ];

    for (const b of blogsData) {
        const existing = await prisma.blog.findUnique({ where: { slug: b.slug } });
        if (!existing) {
            await prisma.blog.create({ data: b });
            console.log('Created blog:', b.title);
        } else {
            console.log('Blog already exists:', b.title);
        }
    }

    console.log('Seeding complete!');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
