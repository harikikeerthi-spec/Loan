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
        featuredImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
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
        featuredImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop',
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
        featuredImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
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
];

async function main() {
    console.log('Seeding blogs...');

    for (const blog of sampleBlogs) {
        const existingBlog = await prisma.blog.findUnique({
            where: { slug: blog.slug },
        });

        if (!existingBlog) {
            await prisma.blog.create({ data: blog });
            console.log(`Created blog: ${blog.title}`);
        } else {
            console.log(`Blog already exists: ${blog.title}`);
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
