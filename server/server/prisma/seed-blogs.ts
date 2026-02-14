import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleBlogs = [
    {
        title: 'Complete Guide to Education Loans in 2026: Everything You Need to Know',
        slug: 'complete-guide-education-loans-2026',
        excerpt: 'From understanding interest rates to navigating the application process, this comprehensive guide covers everything you need to know about education loans.',
        content: `
<h2>Introduction</h2>
<p>Pursuing higher education abroad is a dream for millions of students worldwide. However, the financial aspect can be daunting. Education loans have emerged as a vital tool for students looking to fund their international education without compromising on quality.</p>

<h2>Types of Education Loans</h2>
<h3>Secured Education Loans</h3>
<p>These loans require collateral such as property, fixed deposits, or other assets. They typically offer lower interest rates and higher loan amounts.</p>

<h3>Unsecured Education Loans</h3>
<p>No collateral required, but interest rates are usually higher. Ideal for students without significant assets.</p>

<h3>Government Education Loans</h3>
<p>Subsidized loans offered by government institutions with favorable terms and interest subsidies for economically weaker sections.</p>

<h2>Understanding Interest Rates</h2>
<p>Interest rates for education loans typically range from 8.5% to 12.5% per annum, depending on the lender and your profile.</p>

<h2>Required Documents</h2>
<ul>
<li>Admission letter from the university</li>
<li>Academic transcripts and certificates</li>
<li>Identity and address proof</li>
<li>Income proof of co-applicant</li>
<li>Property documents (for secured loans)</li>
</ul>

<h2>Application Process</h2>
<ol>
<li>Check eligibility with multiple lenders</li>
<li>Compare interest rates and terms</li>
<li>Submit application with required documents</li>
<li>Await verification and approval</li>
<li>Sign loan agreement and receive disbursement</li>
</ol>

<h2>Repayment Strategies</h2>
<p>Most education loans offer a moratorium period covering the study duration plus 6-12 months post-course. Plan your repayment strategy early to avoid financial stress.</p>

<h2>Conclusion</h2>
<p>Education loans are an investment in your future. With proper planning and understanding, you can navigate the process smoothly and focus on what matters most - your education.</p>
    `,
        category: 'Education Loans',
        authorName: 'Rajesh Kumar',
        authorRole: 'Senior Financial Advisor',
        authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
        readTime: 8,
        isFeatured: true,
        isPublished: true,
        publishedAt: new Date('2026-01-15'),
    },
    {
        title: 'Top 10 Countries for International Students in 2026',
        slug: 'top-10-countries-international-students-2026',
        excerpt: 'Discover the best destinations for your international education journey, considering factors like quality of education, cost of living, and post-study work opportunities.',
        content: `
<h2>Introduction</h2>
<p>Choosing the right country for your international education is a crucial decision that impacts your career trajectory. Here's our comprehensive guide to the top destinations.</p>

<h2>1. United States</h2>
<p>Home to world-renowned universities like MIT, Stanford, and Harvard. Offers diverse programs and excellent research opportunities.</p>

<h2>2. United Kingdom</h2>
<p>Rich academic heritage with universities like Oxford and Cambridge. Shorter degree programs mean lower total costs.</p>

<h2>3. Canada</h2>
<p>Known for quality education at affordable costs. Excellent post-study work opportunities and immigration pathways.</p>

<h2>4. Australia</h2>
<p>Strong emphasis on research and innovation. Beautiful climate and high quality of life.</p>

<h2>5. Germany</h2>
<p>Many programs offered in English with low or no tuition fees. Strong economy with excellent job prospects.</p>

<h2>6. Netherlands</h2>
<p>Progressive education system with many English-taught programs. Central European location.</p>

<h2>7. Singapore</h2>
<p>Asian hub for education and business. World-class universities and multicultural environment.</p>

<h2>8. New Zealand</h2>
<p>Safe and welcoming environment. Quality education with a focus on practical learning.</p>

<h2>9. Ireland</h2>
<p>English-speaking country with a growing tech industry. Lower costs compared to the UK.</p>

<h2>10. France</h2>
<p>Rich culture and history. Many programs available in English with reasonable tuition fees.</p>

<h2>Conclusion</h2>
<p>Each country offers unique advantages. Consider your academic goals, budget, and career aspirations when making your decision.</p>
    `,
        category: 'Study Abroad',
        authorName: 'Priya Sharma',
        authorRole: 'Education Consultant',
        authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=400&fit=crop',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-10'),
    },
    {
        title: 'How to Save Money While Studying Abroad',
        slug: 'how-to-save-money-studying-abroad',
        excerpt: 'Practical tips and strategies to manage your finances effectively during your international education journey.',
        content: `
<h2>Introduction</h2>
<p>Studying abroad can be expensive, but with smart planning and budgeting, you can make your money go further.</p>

<h2>Accommodation Tips</h2>
<ul>
<li>Consider shared housing with other students</li>
<li>Look for university-managed accommodations</li>
<li>Explore homestay options for cultural immersion</li>
</ul>

<h2>Food and Groceries</h2>
<ul>
<li>Cook at home instead of eating out</li>
<li>Shop at local markets for fresh produce</li>
<li>Take advantage of student discounts</li>
</ul>

<h2>Transportation</h2>
<ul>
<li>Use public transportation with student passes</li>
<li>Consider cycling or walking for short distances</li>
<li>Carpool with fellow students</li>
</ul>

<h2>Part-Time Work</h2>
<p>Many countries allow international students to work part-time. This can help cover living expenses while gaining valuable experience.</p>

<h2>Scholarships and Grants</h2>
<p>Always research available scholarships. Many go unclaimed simply because students don't apply.</p>

<h2>Conclusion</h2>
<p>Financial planning is key to a successful study abroad experience. Start early and track your expenses regularly.</p>
    `,
        category: 'Financial Tips',
        authorName: 'Amit Patel',
        authorRole: 'Financial Planner',
        authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        readTime: 5,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-08'),
    },
    {
        title: 'Success Story: From Small Town to Stanford',
        slug: 'success-story-small-town-to-stanford',
        excerpt: 'Read how Ananya overcame financial challenges to secure admission and funding at one of the world\'s top universities.',
        content: `
<h2>The Beginning</h2>
<p>Ananya grew up in a small town in Karnataka with big dreams. Her family couldn't afford private coaching, but she was determined to excel.</p>

<h2>The Struggle</h2>
<p>Despite scoring exceptionally in her board exams, the cost of applying to international universities seemed insurmountable.</p>

<h2>Finding LoanHero</h2>
<p>Through our platform, Ananya was able to secure an education loan with favorable terms that covered her tuition and living expenses.</p>

<h2>The Result</h2>
<p>Today, Ananya is pursuing her Master's in Computer Science at Stanford, with a full scholarship for her second year based on her academic performance.</p>

<h2>Her Advice</h2>
<blockquote>"Don't let financial constraints stop you from dreaming big. There are always solutions if you're willing to look for them."</blockquote>

<h2>Key Takeaways</h2>
<ul>
<li>Start early with college applications</li>
<li>Research all available funding options</li>
<li>Don't be afraid to ask for help</li>
<li>Stay persistent and positive</li>
</ul>
    `,
        category: 'Success Stories',
        authorName: 'LoanHero Team',
        authorRole: 'Editorial Team',
        authorImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop',
        readTime: 4,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-05'),
    },
    {
        title: 'Understanding EMI: How Your Loan Repayment Works',
        slug: 'understanding-emi-loan-repayment',
        excerpt: 'Demystifying EMI calculations and helping you plan your loan repayment strategy effectively.',
        content: `
<h2>What is EMI?</h2>
<p>EMI stands for Equated Monthly Installment. It's the fixed amount you pay to the lender every month until your loan is fully repaid.</p>

<h2>How is EMI Calculated?</h2>
<p>EMI is calculated using three factors:</p>
<ul>
<li><strong>Principal Amount (P):</strong> The loan amount borrowed</li>
<li><strong>Interest Rate (R):</strong> Annual interest rate divided by 12</li>
<li><strong>Tenure (N):</strong> Loan duration in months</li>
</ul>

<h2>The Formula</h2>
<p>EMI = P × R × (1+R)^N / [(1+R)^N – 1]</p>

<h2>Breaking Down Your EMI</h2>
<p>Each EMI payment consists of two components:</p>
<ul>
<li><strong>Principal Component:</strong> The portion that reduces your loan balance</li>
<li><strong>Interest Component:</strong> The interest charged on the outstanding balance</li>
</ul>

<h2>Moratorium Period</h2>
<p>Most education loans offer a moratorium period during which you don't need to pay EMIs. This typically covers your study period plus 6-12 months.</p>

<h2>Prepayment Benefits</h2>
<p>Consider making partial prepayments when possible. This reduces your principal and saves interest in the long run.</p>

<h2>Tips for EMI Management</h2>
<ol>
<li>Set up automatic deductions</li>
<li>Keep an emergency fund for 3-6 months of EMIs</li>
<li>Consider loan refinancing if rates drop significantly</li>
</ol>
    `,
        category: 'Financial Tips',
        authorName: 'Rajesh Kumar',
        authorRole: 'Senior Financial Advisor',
        authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-03'),
    },
    {
        title: 'Visa Application Tips for Student Loans',
        slug: 'visa-application-tips-student-loans',
        excerpt: 'Learn how to present your education loan documentation effectively during your student visa application.',
        content: `
<h2>Introduction</h2>
<p>Getting your student visa approved requires demonstrating sufficient financial capacity. Here's how to present your education loan effectively.</p>

<h2>Required Documents</h2>
<ul>
<li>Loan sanction letter</li>
<li>Loan disbursement proof</li>
<li>Repayment schedule</li>
<li>Bank statements showing disbursement</li>
</ul>

<h2>Key Tips</h2>
<h3>1. Get Your Sanction Letter Early</h3>
<p>Apply for your loan as soon as you receive your admission offer. Visa appointments fill up quickly.</p>

<h3>2. Understand Your Loan Terms</h3>
<p>Be prepared to explain your loan terms during the visa interview. Know your interest rate, tenure, and moratorium period.</p>

<h3>3. Show Additional Funds</h3>
<p>If possible, show some personal or family funds in addition to your loan to demonstrate financial stability.</p>

<h3>4. Prepare Supporting Documents</h3>
<p>Have your co-applicant's income proof, employment letters, and ITR copies ready.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
<li>Applying for visa before loan sanction</li>
<li>Incomplete documentation</li>
<li>Not being able to explain loan terms</li>
<li>Showing unrealistic financial plans</li>
</ul>

<h2>Conclusion</h2>
<p>Proper documentation and preparation are key to a successful visa application. Plan ahead and stay organized.</p>
    `,
        category: 'Study Abroad',
        authorName: 'Priya Sharma',
        authorRole: 'Education Consultant',
        authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop',
        readTime: 5,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-01'),
    },
    {
        title: 'Mastering Standardized Tests: A Financial Perspective',
        slug: 'mastering-standardized-tests-financial-perspective',
        excerpt: 'How GRE, GMAT, and TOEFL scores impact your loan eligibility and interest rates. Investing in prep is investing in your loan terms.',
        content: `
<h2>Introduction</h2>
<p>Standardized tests like the GRE, GMAT, and SAT are often seen as hurdles for admission. However, they are also critical financial documents. Banks view high test scores as indicators of high employability, which can significantly lower your loan interest rates.</p>

<h2>How Scores Impact Loans</h2>
<p>Lenders use your test scores as part of their risk assessment. A student with a 330 GRE score is often eligible for "Premium University" loan rates, which can be 0.5% to 1.5% lower than standard rates.</p>

<h2>Prep as an Investment</h2>
<p>If spending $500 on a prep course saves you 1% in interest on a $50,000 loan over 10 years, that's a saving of over $3,000. The ROI on test prep is one of the highest in your study-abroad journey.</p>

<h2>Score-Based Scholarships</h2>
<p>Most merit-based scholarships are heavily weighted toward these scores. Reducing your principal amount through a scholarship is the best way to manage debt.</p>

<h2>Conclusion</h2>
<p>Don't just aim for "passing" scores. Aim for scores that make you a "low-risk" borrower in the eyes of financial institutions.</p>
        `,
        category: 'Study Abroad',
        authorName: 'Anjali Menon',
        authorRole: 'Test Prep Expert',
        authorImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
        readTime: 7,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-20'),
    },
    {
        title: 'Accommodation Hacks for London & New York',
        slug: 'accommodation-hacks-london-ny',
        excerpt: 'The hidden rental markets in the worlds most expensive cities. How to find a safe home without breaking your student budget.',
        content: `
<h2>The Reality of Big City Housing</h2>
<p>London and New York City are notorious for high rents. For an international student, this can be the largest part of your monthly spend.</p>

<h2>1. Look Beyond Zone 1 & 2 (London)</h2>
<p>Zones 3 and 4 offer significantly lower rents with manageable commutes. Look for areas like Stratford or Wembley which have excellent connectivity.</p>

<h2>2. The "Guarantor" Problem</h2>
<p>Most private landlords in NYC require a US-based guarantor who earns 80x the rent. For students, companies like Insurent or TheGuarantors can act as your institutional guarantor for a fee.</p>

<h2>3. Use Student Hubs</h2>
<p>Platforms like SpareRoom, UniLodge, and Facebook University Groups are better than traditional real estate agents for finding roommates.</p>

<h2>4. Budget for Utilities</h2>
<p>Remember to check if "Bills are Included." In London, Council Tax is a big cost, but full-time students are exempt—make sure you get your exemption certificate from the uni!</p>

<h2>Summary</h2>
<p>Start your search at least 12 weeks before your flight. Never pay a deposit before seeing the place or verifying the landlord via video call.</p>
        `,
        category: 'Financial Tips',
        authorName: 'David Wilson',
        authorRole: 'International Student Alumni',
        authorImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-22'),
    },
    {
        title: 'Tax Benefits on Education Loans: Section 80E Explained',
        slug: 'tax-benefits-education-loans-80e',
        excerpt: 'Did you know the interest you pay on your education loan is fully tax-deductible? Here is how to maximize your savings.',
        content: `
<h2>What is Section 80E?</h2>
<p>Under the Indian Income Tax Act, Section 80E allows you to claim a deduction for the interest paid on an education loan taken for higher studies.</p>

<h2>1. Who can claim it?</h2>
<p>Only the individual who has taken the loan can claim the deduction. It can be for their own studies, or for studies of their spouse or children.</p>

<h2>2. No Upper Limit</h2>
<p>Unlike other deductions, there is no maximum limit on the amount of interest you can claim. The entire interest component of your EMI is deductible.</p>

<h2>3. The 8-Year Rule</h2>
<p>The deduction is available for a maximum of 8 years or until the interest is fully repaid, whichever is earlier.</p>

<h2>4. Approved Lenders Only</h2>
<p>The loan must be taken from a scheduled bank or an approved financial institution. Loans from family or friends do not qualify.</p>

<h2>Pro Tip</h2>
<p>If your parents are the co-borrowers and are in a higher tax bracket, taking the loan in their name can lead to greater household tax savings.</p>
        `,
        category: 'Education Loans',
        authorName: 'Suresh Iyer',
        authorRole: 'Tax Consultant',
        authorImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        readTime: 5,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-25'),
    },
    {
        title: 'Mental Health Abroad: Staying Resilient',
        slug: 'mental-health-abroad-resilience',
        excerpt: 'Dealing with loneliness, academic pressure, and cultural shock. Strategies for a healthy mind while chasing your dreams.',
        content: `
<h2>The Unspoken Challenge</h2>
<p>While everyone talks about visas and loans, the mental health of international students is often ignored. Isolation and "Imposter Syndrome" are common but manageable.</p>

<h2>Dealing with Cultural Shock</h2>
<p>Everything from the weather to the social cues will be different. Give yourself a 3-month "grace period" to feel out of place—it is part of the growth process.</p>

<h2>Building a Support System</h2>
<p>Join student societies immediately. Do not just stick to your own community; diversity is the best cure for homesickness.</p>

<h2>Universities Resources</h2>
<p>Most universities in the UK, USA, and Australia offer free, confidential counseling services. Use them. They are experts in student-specific stress like homesickness and exam anxiety.</p>

<h2>Routine is Key</h2>
<p>Keep a regular sleep schedule and try to cook familiar food at least once a week. Small comforts go a long way in stabilizing your mood.</p>
        `,
        category: 'Success Stories',
        authorName: 'Dr. Sarah Smith',
        authorRole: 'Student Counselor',
        authorImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=150&h=150&fit=crop',
        featuredImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
        readTime: 8,
        isFeatured: false,
        isPublished: true,
        publishedAt: new Date('2026-01-28'),
    },
];

async function main() {
    console.log('Seeding blogs...');

    for (const blog of sampleBlogs) {
        const existingBlog = await prisma.blog.findFirst({
            where: { slug: blog.slug },
        });

        if (!existingBlog) {
            await prisma.blog.create({ data: blog });
            console.log(`Created blog: ${blog.title}`);
        } else {
            console.log(`Blog already exists: ${blog.title}`);
            // Update all fields to ensure schema changes are reflected
            await prisma.blog.update({
                where: { id: existingBlog.id },
                data: {
                    ...blog,
                    isPublished: true,
                }
            });
            console.log(`Updated blog fields: ${blog.title}`);
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
