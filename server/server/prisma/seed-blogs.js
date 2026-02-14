const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleBlogs = [
    {
        title: 'Top 5 Universities for Computer Science in 2026',
        slug: 'top-5-cs-universities-2026',
        excerpt: 'Discover the best institutions for pursuing a CS degree abroad with scholarship opportunities.',
        content: `
<h2>Introduction</h2>
<p>Choosing the right university is crucial for your career in Computer Science. In 2026, the landscape of technology education has evolved, with a stronger focus on AI, Quantum Computing, and Sustainable Tech. Here are the top 5 universities leading the charge:</p>

<h2>1. Massachusetts Institute of Technology (MIT)</h2>
<p>MIT continues to dominate the global rankings. With its cutting-edge research facilities and proximity to the tech hub of Kendall Square, students have unparalleled access to internships and startup opportunities.</p>
<p><strong>Key Highlights:</strong> CSAIL Lab access, strong alumni network, and interdisciplinary courses.</p>

<h2>2. Stanford University</h2>
<p>Located in the heart of Silicon Valley, Stanford is synonymous with innovation. The university's CS program emphasizes entrepreneurship, making it the ideal choice for aspiring founders.</p>
<p><strong>Key Highlights:</strong> Connection to VC firms, world-class faculty, and the Stanford AI Lab.</p>

<h2>3. Carnegie Mellon University</h2>
<p>CMU is renowned for its specialized programs in AI, Robotics, and Human-Computer Interaction. Their theoretical approach combined with practical application produces some of the best engineers in the industry.</p>

<h2>4. University of California, Berkeley</h2>
<p>UC Berkeley offers a vibrant campus life and a rigorous CS curriculum. Its proximity to San Francisco and the wider Bay Area ensures students are always close to the action.</p>

<h2>5. ETH Zurich</h2>
<p>For those looking to study in Europe, ETH Zurich is the premier destination. Known for its precision engineering and research output, it offers a high-quality education at a fraction of the cost of US institutions.</p>

<h2>Conclusion</h2>
<p>While rankings are important, consider factors like location, cost, and culture when making your decision. Good luck!</p>
        `,
        category: 'Study Abroad',
        authorName: 'Sarah Jenkins',
        featuredImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        readTime: 6,
        views: 1250,
        isFeatured: true,
        isPublished: true,
        publishedAt: new Date(),
        hashtags: ['computerScience', 'studyAbroad', 'MIT', 'Stanford'],
        comments: {
            create: [
                { content: 'MIT is definitely my dream school!', authorName: 'Rahul Gupta' },
                { content: 'Great list, thanks for sharing.', authorName: 'Emily Chen' }
            ]
        }
    },
    {
        title: 'How to Write a Winning SOP',
        slug: 'how-to-write-winning-sop',
        excerpt: 'A comprehensive guide to crafting a Statement of Purpose that gets you admitted.',
        content: `
<h2>What is an SOP?</h2>
<p>Your Statement of Purpose (SOP) is arguably the most critical part of your university application. Unlike grades or test scores, it gives you a voice. It tells the admissions committee who you are, why you want to study there, and what makes you a unique candidate.</p>

<h2>Structure of a Good SOP</h2>
<p>A winning SOP generally follows this structure:</p>
<ul>
  <li><strong>Introduction:</strong> Hook the reader with a personal anecdote or a compelling reason for your interest in the field.</li>
  <li><strong>Academic Background:</strong> Briefly discuss your undergraduate studies and how they prepared you for this program.</li>
  <li><strong>Professional Experience:</strong> Highlight relevant work experience, internships, or projects. Focus on what you learned, not just what you did.</li>
  <li><strong>Why This Course/University?</strong> Be specific. Mention professors you want to work with, labs you admire, or specific curriculum details.</li>
  <li><strong>Future Goals:</strong> Where do you see yourself in 5 or 10 years? How will this degree help you get there?</li>
</ul>

<h2>Common Mistakes to Avoid</h2>
<p>Avoid generic statements like "I have always been passionate about..." instead, show your passion through examples. Also, do not simply repeat your resume. Your SOP should tell a cohesive story.</p>

<h2>Final Tips</h2>
<p>Start early, write multiple drafts, and get feedback from mentors or seniors. A polished, well-thought-out SOP can make up for average grades!</p>
        `,
        category: 'Guides',
        authorName: 'Dr. A. Kumar',
        featuredImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        readTime: 8,
        views: 890,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date(),
        hashtags: ['sop', 'applicationTips', 'studyAbroad'],
        comments: {
            create: [
                { content: 'Very helpful tips, thank you!', authorName: 'Aman Singh' }
            ]
        }
    },
    {
        title: 'Education Loans: Fixed vs Floating Rates',
        slug: 'education-loans-fixed-vs-floating-rates',
        excerpt: 'Navigate the complex world of student loans and choose the best interest rate for you.',
        content: `
<h2>Interest Rates Explained</h2>
<p>When applying for an education loan, one of the biggest decisions you'll make is choosing between a fixed and a floating interest rate. Both have their pros and cons, and the right choice depends on the economic environment and your personal risk tolerance.</p>

<h2>Fixed Interest Rates</h2>
<p>A fixed interest rate remains the same throughout the entire loan tenure. This means your EMI (Equated Monthly Installment) amounts are predictable.</p>
<p><strong>Pros:</strong> Stability, protection against rising market rates, easier budgeting.</p>
<p><strong>Cons:</strong> Usually starts slightly higher than floating rates; you don't benefit if market rates fall.</p>

<h2>Floating Interest Rates</h2>
<p>A floating rate is linked to a benchmark (like the Repo Rate or MCLR). It changes periodically based on market conditions.</p>
<p><strong>Pros:</strong> Generally starts lower than fixed rates; potential for savings if rates drop.</p>
<p><strong>Cons:</strong> Uncertainty; your EMI can increase if the economy changes.</p>

<h2>Which One Should You Choose?</h2>
<p>If we are in a rising interest rate cycle, locking in a fixed rate might be wise. If rates are at historic highs and expected to fall, a floating rate could save you money in the long run. Always consult with a financial advisor before signing.</p>
        `,
        category: 'Finance',
        authorName: 'Rajiv Mehta',
        featuredImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        readTime: 5,
        views: 450,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date(),
        hashtags: ['finance', 'educationLoan', 'interestRates'],
        comments: {
            create: []
        }
    },
    {
        title: 'Success Story: From Small Town to Stanford',
        slug: 'success-story-small-town-to-stanford',
        excerpt: 'Read how Ananya overcame financial challenges to secure admission and funding at one of the world\'s top universities.',
        content: `
<h2>The Beginning</h2>
<p>Ananya grew up in a small town with limited resources. Despite the lack of advanced coaching centers, she relied on online resources and sheer determination to prepare for her GRE and TOEFL exams.</p>

<h2>Overcoming Obstacles</h2>
<p>The biggest hurdle wasn't the exams—it was funding. The cost of a Masters at Stanford was astronomical for her family. However, Ananya didn't give up. She applied for multiple scholarships and secured a partial grant.</p>

<h2>The Role of Education Loans</h2>
<p>For the remaining amount, she approached EduLoan. With a co-applicant and a solid academic record, she secured a low-interest loan that covered her tuition and living expenses using a non-collateral scheme.</p>

<h2>Today</h2>
<p>Ananya is now a Senior Product Manager at a leading tech firm in Silicon Valley. Her story is a testament to the fact that financial constraints should never stop you from dreaming big.</p>
        `,
        category: 'Success Stories',
        authorName: 'LoanHero Team',
        authorRole: 'Editorial Team',
        featuredImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
        readTime: 4,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-05'),
        hashtags: ['inspiration', 'stanford', 'successStory'],
        comments: {
            create: [
                { content: 'So inspiring! Congratulations Ananya.', authorName: 'Priya K.' },
                { content: 'Proof that hard work pays off.', authorName: 'Rohan D.' }
            ]
        }
    },
    {
        title: 'Understanding EMI: How Your Loan Repayment Works',
        slug: 'understanding-emi-loan-repayment',
        excerpt: 'Demystifying EMI calculations and helping you plan your loan repayment strategy effectively.',
        content: `
<h2>What is EMI?</h2>
<p>EMI stands for Equated Monthly Installment. It is the fixed amount you pay to the bank every month to repay your loan. It consists of two parts: the principal amount and the interest accumulated.</p>

<h2>How is it Calculated?</h2>
<p>The formula for EMI is: <strong>E = P * r * (1+r)^n / ((1+r)^n - 1)</strong></p>
<p>Where P is Principal, r is interest rate per month, and n is tenure in months.</p>

<h2>Tips for Managing Repayment</h2>
<ul>
    <li><strong>Pay during the moratorium:</strong> If possible, pay simple interest during your course period to reduce the overall burden.</li>
    <li><strong>Prepay when possible:</strong> Any bonus or extra savings should go towards prepaying the principal.</li>
    <li><strong>Choose the right tenure:</strong> A longer tenure means lower EMIs but higher total interest payout.</li>
</ul>
        `,
        category: 'Financial Tips',
        authorName: 'Rajesh Kumar',
        authorRole: 'Senior Financial Advisor',
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-03'),
        hashtags: ['emi', 'repayment', 'financialPlanning'],
        comments: {
            create: []
        }
    },
    {
        title: 'Visa Application Tips for Student Loans',
        slug: 'visa-application-tips-student-loans',
        excerpt: 'Learn how to present your education loan documentation effectively during your student visa application.',
        content: `
<h2>Introduction</h2>
<p>Getting your student visa approved is the final and often most stressful step. Consular officers want to ensure you have sufficient funds to cover your education and living expenses without resorting to illegal employment.</p>

<h2>Loan Sanction Letter</h2>
<p>Your loan sanction letter is a crucial document. Ensure it matches the amount required as per the university's I-20 form. It should be on the bank's official letterhead and clearly state the loan amount and terms.</p>

<h2>Common Interview Questions</h2>
<p>Be prepared to answer questions like:</p>
<ul>
    <li>Who is sponsoring your education?</li>
    <li>How will you repay the loan? (Focus on future employability in your home country)</li>
    <li>Why did you choose this university?</li>
</ul>

<h2>Documentation Checklist</h2>
<p>Carry your original sanction letter, disbursement records (if any), and proof of any liquid assets your parents hold. Being organized shows professionalism and intent.</p>
        `,
        category: 'Study Abroad',
        authorName: 'Priya Sharma',
        authorRole: 'Education Consultant',
        featuredImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop',
        readTime: 5,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-01'),
        hashtags: ['visa', 'interviewTips', 'studyAbroad'],
        comments: {
            create: [
                { content: 'Just got my visa approved! This guide helped a lot.', authorName: 'Karthik R.' }
            ]
        }
    },
];

async function main() {
    console.log('Seeding blogs...');

    for (const blog of sampleBlogs) {
        // Handle field mapping: "featured" -> "featured" (mapped to isFeatured in DB), "published" -> "published" (mapped to isPublished in DB)
        // Schema requires: published, featured (Prisma Client handles @map)

        /* 
           Wait, previous error in Step 742 said Property 'blog' does not exist... 
           and Step 676 said 'isPublished' does not exist in type 'BlogWhereInput'.
           So Client expects 'published' and 'featured'.
           The object keys in sampleBlogs above are 'featured' and 'published', so we are good.
        */

        try {
            const result = await prisma.blog.upsert({
                where: { slug: blog.slug },
                update: blog,
                create: blog,
            });
            console.log(`Upserted blog: ${result.title}`);
        } catch (e) {
            console.error(`Error processing ${blog.title}:`, e);
        }
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
