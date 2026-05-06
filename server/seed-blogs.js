const http = require('http');

const blogs = [
    {
        title: 'Complete Guide to Education Loans for Studying Abroad in 2026',
        slug: 'complete-guide-education-loans-abroad-2026',
        excerpt: 'Everything you need to know about securing an education loan for your dream university — from eligibility to repayment strategies.',
        content: '<h2>Why Education Loans Are the Smart Choice</h2><p>Studying abroad is a life-changing investment, and education loans make it accessible to millions of students worldwide. In 2026, Indian banks and NBFCs are offering competitive rates, flexible repayment options, and collateral-free loans for amounts up to 20 lakhs.</p><h2>Understanding Eligibility Criteria</h2><p>Most banks require the following:</p><ul><li>Admission confirmation from a recognized university</li><li>Academic records (10th, 12th, graduation)</li><li>Co-applicant (parent/guardian) with stable income</li><li>Collateral for loans above 7.5 lakhs (varies by bank)</li></ul><h2>Top Banks for Education Loans</h2><p><strong>SBI:</strong> Offers loans up to 1.5 crore with interest rates starting at 8.15%. The Scholar Loan Scheme provides collateral-free loans up to 20 lakh.</p><p><strong>Bank of Baroda:</strong> The Baroda Scholar scheme covers tuition, living expenses, and even laptop costs. Rates start from 8.35%.</p><p><strong>HDFC Credila:</strong> Specialized in education loans with quick processing (7-10 days) and coverage for 2,200+ universities.</p><h2>Step-by-Step Application Process</h2><ol><li><strong>Research and Shortlist:</strong> Compare at least 3-4 banks based on interest rates, processing fees, and repayment terms.</li><li><strong>Gather Documents:</strong> Admission letter, KYC docs, income proof, academic transcripts, collateral papers (if applicable).</li><li><strong>Apply Online or Visit Branch:</strong> Most banks offer online applications.</li><li><strong>Verification and Sanction:</strong> Bank verifies documents and sanctions the loan within 7-15 days.</li><li><strong>Disbursement:</strong> Loan is disbursed directly to the university in installments.</li></ol><h2>Repayment Strategies</h2><ul><li>Start paying interest during the moratorium period</li><li>Make partial prepayments whenever possible</li><li>Consider refinancing if better rates become available</li><li>Claim tax deduction under Section 80E</li></ul>',
        category: 'Education Loans',
        authorName: 'Priya Sharma',
        authorRole: 'Education Finance Advisor',
        readTime: 8,
        isFeatured: true,
        isPublished: true,
        tags: ['education-loan', 'study-abroad', 'financial-planning']
    },
    {
        title: '10 Scholarships Every Indian Student Should Know About',
        slug: '10-scholarships-indian-students-2026',
        excerpt: 'Discover top scholarships that can significantly reduce your study abroad expenses — some cover full tuition and living costs!',
        content: '<h2>Fund Your Dreams Without Breaking the Bank</h2><p>Scholarships are the golden ticket to affordable education abroad. Knowing where to look and how to apply can dramatically increase your chances.</p><h2>1. Fulbright-Nehru Fellowship (USA)</h2><p>One of the most prestigious scholarships worldwide. Covers tuition, living stipend, airfare, and health insurance.</p><h2>2. Chevening Scholarship (UK)</h2><p>Fully funded by the UK Government. Covers tuition, monthly stipend, travel costs, and thesis allowance.</p><h2>3. DAAD Scholarship (Germany)</h2><p>Scholarships for Masters programs with monthly stipends plus health insurance and travel allowance.</p><h2>4. Australia Awards</h2><p>Covers full tuition, return air travel, establishment allowance, living expenses, and health insurance.</p><h2>5. Erasmus Mundus (Europe)</h2><p>EU-funded program covering tuition, travel, installation costs, and monthly allowance. Study across multiple European universities.</p><h2>6. Commonwealth Scholarship (UK)</h2><p>For students from Commonwealth nations. Covers airfare, tuition, living allowance, and thesis grant.</p><h2>7. Swedish Institute Scholarship</h2><p>Covers tuition, living expenses, travel grant, and insurance for Masters programs.</p><h2>8. Rotary Peace Fellowship</h2><p>Fully funded Masters program covering tuition, room, board, and internship expenses.</p><h2>9. Aga Khan Foundation Scholarship</h2><p>Need-based scholarship for postgraduate studies. 50% grant and 50% interest-free loan.</p><h2>10. University-Specific Scholarships</h2><p>Do not overlook university merit scholarships! Schools like Stanford, MIT, Oxford, and Melbourne offer generous aid packages.</p><h2>Pro Tips</h2><ul><li>Start applications 12-18 months early</li><li>Tailor each essay to the specific scholarship</li><li>Get strong recommendation letters</li><li>Highlight leadership and community impact</li><li>Apply to multiple scholarships</li></ul>',
        category: 'Scholarships',
        authorName: 'Rahul Mehta',
        authorRole: 'Study Abroad Counselor',
        readTime: 10,
        isFeatured: false,
        isPublished: true,
        tags: ['scholarships', 'study-abroad', 'financial-aid']
    },
    {
        title: 'USA vs UK vs Australia: Where Should You Study in 2026?',
        slug: 'usa-vs-uk-vs-australia-comparison-2026',
        excerpt: 'A comprehensive comparison of the top three study abroad destinations — costs, job prospects, visa policies, and student experience.',
        content: '<h2>Choosing Your Study Destination</h2><p>Picking the right country is as important as choosing the right university. Each destination offers unique advantages.</p><h2>Cost Comparison</h2><p><strong>USA:</strong> Tuition ranges from $20,000-$60,000/year. Living costs: $12,000-$20,000/year.</p><p><strong>UK:</strong> Tuition: 12,000-35,000 GBP/year. Living costs: 12,000-15,000 GBP/year. A 1-year Masters makes it cost-effective.</p><p><strong>Australia:</strong> Tuition: AUD 20,000-45,000/year. Living costs: AUD 21,000-30,000/year.</p><h2>Work Opportunities</h2><p><strong>USA (OPT/CPT):</strong> 12-36 months post-study work. STEM OPT extension is attractive for tech graduates.</p><p><strong>UK (Graduate Route):</strong> 2-year post-study work visa. No sponsorship needed.</p><p><strong>Australia:</strong> 2-4 year post-study work visa. Strong demand in healthcare, IT, and engineering.</p><h2>Quality of Education</h2><p>All three host world-class universities. USA leads in research. UK offers intensive 1-year Masters. Australia is known for practical, industry-connected education.</p><h2>The Verdict</h2><p>Choose USA for research and STEM careers, UK for a quick prestigious Masters, and Australia for work-life balance and immigration pathways.</p>',
        category: 'Study Abroad',
        authorName: 'Ananya Iyer',
        authorRole: 'International Education Specialist',
        readTime: 7,
        isFeatured: true,
        isPublished: true,
        tags: ['study-abroad', 'usa', 'uk', 'australia']
    },
    {
        title: 'How I Secured a 45 Lakh Education Loan with No Collateral',
        slug: 'secured-45-lakh-loan-no-collateral',
        excerpt: 'Real story of how I navigated the education loan process and got a collateral-free loan for my Masters at Georgia Tech.',
        content: '<h2>My Journey to Georgia Tech</h2><p>When I got my admit from Georgia Tech for MS in Computer Science, I was thrilled but the estimated cost of 45 lakhs felt overwhelming. My family did not have property for collateral.</p><h2>Step 1: Research</h2><p>I spent two weeks comparing every bank and NBFC. I created a spreadsheet with interest rates, processing fees, moratorium periods, and collateral requirements.</p><h2>Step 2: Building a Strong Profile</h2><p>I prepared a compelling case with my high GRE score (332), strong academics (9.2 CGPA), Georgia Tech global ranking, and strong job placement data.</p><h2>Step 3: Approaching the Right Lenders</h2><p>I applied to SBI, HDFC Credila, and Prodigy Finance simultaneously. HDFC Credila approved 45 lakh collateral-free based on the university ranking and my academic profile.</p><h2>Step 4: Negotiation</h2><p>I used my SBI offer as leverage and got 0.25% knocked off the interest rate, saving 1.8 lakh over the loan tenure.</p><h2>Key Takeaways</h2><ul><li>A strong university ranking can replace collateral</li><li>Prepare documents before applying</li><li>Apply to multiple lenders and negotiate</li><li>Start the process 3-4 months early</li></ul><p>Today, working at a top tech company in the Bay Area, I am on track to repay my loan within 3 years.</p>',
        category: 'Success Stories',
        authorName: 'Vikram Reddy',
        authorRole: 'Software Engineer, Bay Area',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        tags: ['success-story', 'collateral-free', 'education-loan']
    },
    {
        title: '5 Common Education Loan Mistakes That Cost Students Lakhs',
        slug: '5-common-education-loan-mistakes',
        excerpt: 'Avoid these costly mistakes that students commonly make when applying for education loans.',
        content: '<h2>Learn from Others</h2><p>Every year, thousands of students make avoidable mistakes during the education loan process. Here are the top 5.</p><h2>Mistake 1: Not Comparing Multiple Lenders</h2><p>A difference of 0.5% in interest rate on a 30 lakh loan over 10 years means savings of 2-3 lakhs. Always compare at least 4-5 lenders.</p><h2>Mistake 2: Ignoring the Moratorium Period</h2><p>Interest accumulates during the moratorium. On a 25 lakh loan at 10%, you will owe nearly 6 lakh in accrued interest. Start paying interest during the moratorium if possible.</p><h2>Mistake 3: Not Reading the Fine Print</h2><p>Prepayment penalties, processing fee refund policies, insurance requirements — these hidden clauses catch students off guard.</p><h2>Mistake 4: Borrowing More Than Needed</h2><p>You pay interest on every rupee borrowed. Calculate your actual needs carefully including tuition, living expenses, and emergency buffer.</p><h2>Mistake 5: Forgetting Tax Benefits</h2><p>Under Section 80E, the entire interest paid on education loans is tax-deductible for up to 8 years. Keep all interest payment receipts.</p>',
        category: 'Tips & Guides',
        authorName: 'Deepa Krishnan',
        authorRole: 'Financial Advisor',
        readTime: 5,
        isFeatured: false,
        isPublished: true,
        tags: ['education-loan', 'financial-tips', 'mistakes']
    },
    {
        title: 'The Ultimate Document Checklist for Education Loan Applications',
        slug: 'ultimate-document-checklist-education-loan',
        excerpt: 'Every document you need for a smooth education loan application — organized by category.',
        content: '<h2>Be Prepared, Get Approved Faster</h2><p>The number one reason for loan delays is missing documentation. Banks process complete applications 60% faster.</p><h2>Academic Documents</h2><ul><li>10th and 12th mark sheets and certificates</li><li>Graduation mark sheets (all semesters)</li><li>Degree or provisional certificate</li><li>GRE/GMAT/IELTS/TOEFL scores</li><li>Recommendation letters</li></ul><h2>Admission Documents</h2><ul><li>University offer letter</li><li>I-20 (USA) / CAS (UK) / CoE (Australia)</li><li>Fee structure</li><li>Course details and duration</li><li>Scholarship letter (if applicable)</li></ul><h2>Identity and Address Proof</h2><ul><li>Passport (all pages)</li><li>Aadhaar Card</li><li>PAN Card</li><li>Address proof</li></ul><h2>Financial Documents</h2><ul><li>Income Tax Returns (3 years)</li><li>Salary slips (6 months)</li><li>Bank statements (12 months)</li><li>Form 16</li></ul><h2>Collateral Documents</h2><ul><li>Property documents</li><li>Valuation report</li><li>Encumbrance Certificate</li><li>Property tax receipts</li></ul><h2>Pro Tips</h2><ul><li>Keep 3 sets of photocopies</li><li>Create digital scans in organized folders</li><li>Start gathering documents 2 months before applying</li></ul>',
        category: 'Tips & Guides',
        authorName: 'Sneha Patel',
        authorRole: 'Loan Documentation Expert',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        tags: ['documents', 'education-loan', 'checklist']
    },
    {
        title: 'Top 5 Affordable Cities for Indian Students in Europe',
        slug: 'affordable-cities-europe-indian-students-2026',
        excerpt: 'Want to study in Europe without breaking the bank? Check out these student-friendly cities with low living costs and high quality of life.',
        content: '<h2>Study in Europe on a Budget</h2><p>Europe is often seen as expensive, but many cities offer world-class education at a fraction of the cost of London or Paris. Here are the top 5 affordable picks for 2026.</p><h2>1. Berlin, Germany</h2><p><strong>Tuition:</strong> Free at public universities (semester contribution ~€300).</p><p><strong>Living Cost:</strong> €900-1,200/month.</p><p>Vibrant culture, great nightlife, and a booming tech scene make it a top choice.</p><h2>2. Warsaw, Poland</h2><p><strong>Tuition:</strong> €2,000-4,000/year.</p><p><strong>Living Cost:</strong> €500-750/month.</p><p>One of the cheapest capitals in Europe with excellent English-taught programs.</p><h2>3. Budapest, Hungary</h2><p><strong>Tuition:</strong> €2,500-5,000/year.</p><p><strong>Living Cost:</strong> €600-800/month.</p><p>Stunning architecture, thermal baths, and a large international student community.</p><h2>4. Valencia, Spain</h2><p><strong>Tuition:</strong> €1,000-3,000/year.</p><p><strong>Living Cost:</strong> €800-1,000/month.</p><p>Great weather, beaches, and paella! More affordable than Madrid or Barcelona.</p><h2>5. Prague, Czech Republic</h2><p><strong>Tuition:</strong> €3,000-5,000/year.</p><p><strong>Living Cost:</strong> €700-950/month.</p><p>Historic beauty combined with low costs and a central location for traveling around Europe.</p>',
        category: 'Study Abroad',
        authorName: 'Rohan Gupta',
        authorRole: 'Travel & Education Blogger',
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        tags: ['europe', 'study-abroad', 'budget-travel']
    },
    {
        title: 'How to Write a Winning Statement of Purpose (SOP)',
        slug: 'how-to-write-winning-sop-2026',
        excerpt: 'Your SOP can make or break your application. Learn the secrets to crafting a compelling story that gets you admitted.',
        content: '<h2>The Importance of an SOP</h2><p>Grades get you to the door; your SOP opens it. It is your chance to speak directly to the admissions committee and explain why YOU fit their program.</p><h2>Structure of a Great SOP</h2><ol><li><strong>The Hook:</strong> Start with a personal anecdote or a strong statement about your motivation.</li><li><strong>Academic Background:</strong> Briefly mention your undergrad achievements and how they prepared you.</li><li><strong>Professional Experience:</strong> Highlight work experience, internships, and skills gained.</li><li><strong>Why This Course?:</strong> Be specific about modules, professors, and research facilities.</li><li><strong>Why This University?:</strong> Show you have done your research. Mention clubs, campus culture, or location.</li><li><strong>Future Goals:</strong> Connect the degree to your long-term career aspirations.</li></ol><h2>Common Mistakes</h2><ul><li>Rehashing your resume (do not just list achievements)</li><li>Using generic templates</li><li>Exceeding the word limit</li><li>Grammatical errors (proofread multiple times!)</li></ul><h2>Pro Tip</h2><p>Be authentic. Admissions officers read thousands of essays. A genuine, unique story stands out more than perfect but robotic language.</p>',
        category: 'Tips & Guides',
        authorName: 'Sarah Jenkins',
        authorRole: 'Admissions Consultant',
        readTime: 8,
        isFeatured: true,
        isPublished: true,
        tags: ['sop', 'application-tips', 'admissions']
    },
    {
        title: 'Part-Time Jobs for International Students: A Survival Guide',
        slug: 'part-time-jobs-international-students-guide',
        excerpt: 'Managing expenses while studying abroad is easier with a part-time job. Here are the best options and rules you need to know.',
        content: '<h2>Working While Studying</h2><p>Most countries allow international students to work part-time (usually 20 hours/week) during term time and full-time during breaks. It is a great way to cover living expenses and gain local experience.</p><h2>Best Part-Time Jobs</h2><ul><li><strong>On-Campus Jobs:</strong> Library assistant, campus tour guide, administrative support. (Highly recommended as they are flexible with class schedules).</li><li><strong>Retail & Hospitality:</strong> Barista, waiter, sales assistant. Good for improving language skills.</li><li><strong>Tutoring:</strong> Teach math, science, or your native language.</li><li><strong>Freelancing:</strong> Graphic design, content writing, coding. Work from anywhere!</li></ul><h2>Key Regulations</h2><p><strong>USA:</strong> off-campus work is restricted in the first year. On-campus is allowed.</p><p><strong>UK:</strong> 20 hours/week during term, full-time during holidays (Tier 4 visa).</p><p><strong>Canada:</strong> 20 hours/week off-campus without a separate work permit.</p><p><strong>Australia:</strong> 48 hours per fortnight during term time.</p><h2>Balancing Act</h2><p>Do not let work affect your grades. Your primary goal is education. Prioritize assignments and exam preparation over extra shifts.</p>',
        category: 'Student Life',
        authorName: 'Michael Chen',
        authorRole: 'Student Mentor',
        readTime: 5,
        isFeatured: false,
        isPublished: true,
        tags: ['part-time-job', 'student-life', 'finance']
    }
];

function postBlog(blog) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(blog);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/blogs',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    resolve({ success: false, message: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function seed() {
    for (const blog of blogs) {
        try {
            let result = await postBlog(blog);
            if (result.success || result.statusCode === 201) {
                console.log(`Created: ${blog.title}`);
            } else {
                const { tags, ...blogWithoutTags } = blog;
                if (tags && tags.length > 0) {
                    console.log(`Initial attempt failed for ${blog.title}. Retrying without tags due to possible tag conflicts...`);
                    result = await postBlog(blogWithoutTags);
                    if (result.success || result.statusCode === 201) {
                        console.log(`Created (without tags): ${blog.title}`);
                    } else {
                        console.log(`Skipping: ${blog.title} (Reason: ${JSON.stringify(result)})`);
                    }
                } else {
                    console.log(`Skipping: ${blog.title} (Reason: ${JSON.stringify(result)})`);
                }
            }
        } catch (e) {
            console.log(`ERROR: ${blog.title} - ${e.message}`);
        }
    }
    console.log('\nDone! All blogs seeded.');
    process.exit(0);
}

seed();
