import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdditionalCommunityData() {
    console.log('🌱 Seeding additional community data...');

    // ==================== ADDITIONAL EVENTS ====================
    console.log('Creating additional events...');
    const events = await Promise.all([
        prisma.communityEvent.create({
            data: {
                title: 'Scholarship Hunting Workshop: Find Free Money for Your Degree',
                description:
                    'Learn how to discover and apply for scholarships that can significantly reduce your education loan burden. Our experts will walk you through the top 50 scholarships available for Indian students studying abroad, application strategies, and common mistakes to avoid.',
                type: 'workshop',
                category: 'scholarship',
                date: '2026-03-05',
                time: '4:00 PM - 6:00 PM IST',
                duration: 120,
                speaker: 'Dr. Anita Desai',
                speakerTitle: 'Scholarship Advisor & Education Consultant',
                maxAttendees: 400,
                attendeesCount: 310,
                isFree: true,
                isFeatured: true,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'USA F1 Visa Interview Masterclass',
                description:
                    'Mock interview sessions and expert tips for cracking the F1 visa interview. Includes common questions, how to present your financial documents, and dealing with rejection. Live Q&A with successful visa applicants.',
                type: 'workshop',
                category: 'visa',
                date: '2026-03-10',
                time: '10:00 AM - 12:30 PM IST',
                duration: 150,
                speaker: 'Ramesh Krishnan',
                speakerTitle: 'Former US Consulate Advisor',
                maxAttendees: 250,
                attendeesCount: 230,
                isFree: false,
                isFeatured: true,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'GRE/GMAT Prep: Study Smart, Not Hard',
                description:
                    'Top-scoring GRE and GMAT test-takers share their study strategies, resource recommendations, and time management tips. Get insights on how your test scores impact both university admissions and loan eligibility.',
                type: 'webinar',
                category: 'universities',
                date: '2026-03-15',
                time: '7:00 PM - 8:30 PM IST',
                duration: 90,
                speaker: 'Neha Gupta & Rohit Malhotra',
                speakerTitle: 'GRE 335+ & GMAT 750+ Scorers',
                maxAttendees: 600,
                attendeesCount: 480,
                isFree: true,
                isFeatured: false,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'Student Housing Abroad: Budget Tips & City Guides',
                description:
                    'Navigating accommodation options in the US, UK, Canada, and Australia. Learn about on-campus vs off-campus housing, cost breakdowns by city, lease agreements, and how to budget for living expenses alongside your loan EMI.',
                type: 'qa',
                category: 'accommodation',
                date: '2026-03-20',
                time: '5:00 PM - 6:30 PM IST',
                duration: 90,
                speaker: 'Student Panel',
                speakerTitle: 'Current International Students',
                maxAttendees: 350,
                attendeesCount: 280,
                isFree: true,
                isFeatured: false,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'Part-Time Jobs While Studying: Legal Guide for International Students',
                description:
                    'Understanding work regulations for international students, finding on-campus jobs, CPT/OPT in USA, Tier 4 work rights in UK, and how part-time income can help with loan repayment. Real stories from students who balanced work and studies.',
                type: 'webinar',
                category: 'loan',
                date: '2026-03-25',
                time: '6:30 PM - 8:00 PM IST',
                duration: 90,
                speaker: 'Adv. Sanjay Mehta',
                speakerTitle: 'Immigration Attorney',
                maxAttendees: 500,
                attendeesCount: 390,
                isFree: true,
                isFeatured: true,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'Loan Repayment Strategies: Pay Off Faster & Save Lakhs',
                description:
                    'Financial planners discuss strategies to accelerate loan repayment, including prepayment benefits, balance transfers, tax deductions under Section 80E, and investment approaches while repaying education loans.',
                type: 'webinar',
                category: 'loan',
                date: '2026-04-01',
                time: '7:00 PM - 8:30 PM IST',
                duration: 90,
                speaker: 'CA Priya Rao',
                speakerTitle: 'Chartered Accountant & Financial Planner',
                maxAttendees: 450,
                attendeesCount: 370,
                isFree: true,
                isFeatured: false,
            },
        }),
    ]);
    console.log(`✅ Created ${events.length} additional events`);

    // ==================== ADDITIONAL SUCCESS STORIES ====================
    console.log('Creating additional success stories...');
    const stories = await Promise.all([
        prisma.successStory.create({
            data: {
                name: 'Ananya Reddy',
                email: 'ananya.reddy@example.com',
                university: 'London School of Economics',
                country: 'UK',
                degree: 'MSc Finance',
                category: 'Finance',
                loanAmount: '₹35,00,000',
                bank: 'Axis Bank',
                interestRate: '8.0%',
                story:
                    'Coming from a middle-class family in Hyderabad, I never imagined studying at LSE. Axis Bank\'s education loan made it possible. The key was preparing a strong SOP that highlighted my career goals. LoanHero\'s document checklist saved me weeks of running around for paperwork. I graduated top of my class and now work at Goldman Sachs London!',
                tips: 'Always have a clear career plan to present to the bank. It increases your chances of approval. Also, apply to multiple banks simultaneously to compare offers.',
                isApproved: true,
                isFeatured: true,
                image: 'assets/img/avatar_2.png',
            },
        }),
        prisma.successStory.create({
            data: {
                name: 'Arvind Kumar',
                email: 'arvind.kumar@example.com',
                university: 'Technical University of Munich',
                country: 'Germany',
                degree: 'MS Mechanical Engineering',
                category: 'Engineering',
                loanAmount: '₹15,00,000',
                bank: 'Bank of Baroda',
                interestRate: '7.2%',
                story:
                    'Germany was a smart choice — tuition is almost free! I only needed a loan for living expenses and blocked account requirements. Bank of Baroda offered the lowest interest rate. The mentor I was connected with through LoanHero guided me through the German visa process, which is quite different from US/UK applications.',
                tips: 'Consider countries like Germany where tuition is minimal. Your loan amount will be much smaller, and repayment becomes much easier. Learn basic German — it helps with part-time jobs.',
                isApproved: true,
                isFeatured: true,
                image: 'assets/img/avatar_3.png',
            },
        }),
        prisma.successStory.create({
            data: {
                name: 'Fatima Sheikh',
                email: 'fatima.sheikh@example.com',
                university: 'University of British Columbia',
                country: 'Canada',
                degree: 'PhD Computer Science',
                category: 'Computer Science',
                loanAmount: '₹20,00,000',
                bank: 'Punjab National Bank',
                interestRate: '7.5%',
                story:
                    'As a PhD student, I had a research assistantship that covered most of my tuition. I needed a loan primarily for the first year before the funding kicked in. PNB was very supportive of PhD applications. Now in my third year, I\'ve already started repaying thanks to my RA stipend. LoanHero\'s EMI calculator helped me plan my finances perfectly.',
                tips: 'If you\'re pursuing a PhD, highlight your research funding and assistantship in your loan application. Banks view funded PhD students favorably. Also, start repaying interest during your studies if possible — it reduces the total cost significantly.',
                isApproved: true,
                isFeatured: false,
                image: 'assets/img/avatar_1.png',
            },
        }),
        prisma.successStory.create({
            data: {
                name: 'Siddharth Nair',
                email: 'siddharth.nair@example.com',
                university: 'National University of Singapore',
                country: 'Singapore',
                degree: 'MBA',
                category: 'MBA',
                loanAmount: '₹45,00,000',
                bank: 'Kotak Mahindra Bank',
                interestRate: '8.5%',
                story:
                    'NUS MBA was my dream, and Kotak Mahindra made it happen with their quick processing. What stood out was their flexible repayment plan that adjusted to my post-MBA salary growth. I graduated 6 months ago and already completed 3 EMI payments. The career services at NUS helped me land a role at McKinsey Singapore.',
                tips: 'Look for banks that offer step-up EMI plans — you pay less initially and more as your salary grows. Also, Singapore offers excellent post-study work opportunities, so factor that into your decision.',
                isApproved: true,
                isFeatured: true,
                image: 'assets/img/avatar_2.png',
            },
        }),
        prisma.successStory.create({
            data: {
                name: 'Deepa Menon',
                email: 'deepa.menon@example.com',
                university: 'University of Sydney',
                country: 'Australia',
                degree: 'Master of Public Health',
                category: 'Medical',
                loanAmount: '₹30,00,000',
                bank: 'HDFC Bank',
                interestRate: '8.2%',
                story:
                    'Australia\'s healthcare education is world-class, and HDFC made my dream accessible. The loan process took just 10 days since I had all documents ready (thanks to LoanHero\'s checklist!). The moratorium period was crucial as public health internships during my course didn\'t pay much. Now working with WHO in their Asia-Pacific office.',
                tips: 'For medical and health sciences, check if your university offers clinical placements — these add immense value. Also, Australia\'s post-study work visa (485) gives you 2-4 years to work and start repaying your loan.',
                isApproved: true,
                isFeatured: false,
                image: 'assets/img/avatar_1.png',
            },
        }),
    ]);
    console.log(`✅ Created ${stories.length} additional success stories`);

    // ==================== ADDITIONAL RESOURCES ====================
    console.log('Creating additional resources...');
    const resources = await Promise.all([
        prisma.communityResource.create({
            data: {
                title: 'Country-Wise Education Loan Comparison Guide 2026',
                description:
                    'Comprehensive comparison of education loan options for students going to USA, UK, Canada, Australia, Germany, and Singapore. Includes interest rates, collateral requirements, processing times, and repayment terms from 15+ banks.',
                type: 'guide',
                category: 'Loan Comparison',
                downloads: 2340,
                isFeatured: true,
                fileUrl: 'https://resources.loanhero.com/country-wise-comparison-2026.pdf',
                downloadUrl: 'https://resources.loanhero.com/download/country-wise-comparison-2026.pdf',
                thumbnailUrl: 'assets/img/resource-comparison.png',
            },
        }),
        prisma.communityResource.create({
            data: {
                title: 'SOP Writing Guide for Education Loan Applications',
                description:
                    'How to write a compelling Statement of Purpose that not only impresses universities but also strengthens your education loan application. Includes 5 real SOP templates for different fields of study.',
                type: 'template',
                category: 'Application',
                downloads: 1780,
                isFeatured: true,
                fileUrl: 'https://resources.loanhero.com/sop-guide.pdf',
                downloadUrl: 'https://resources.loanhero.com/download/sop-guide.pdf',
            },
        }),
        prisma.communityResource.create({
            data: {
                title: 'Education Loan Tax Benefits: Section 80E Explained',
                description:
                    'Detailed video guide explaining how to claim tax deductions on education loan interest under Section 80E of the Income Tax Act. Includes calculation examples, filing tips, and documentation requirements.',
                type: 'video',
                category: 'Tax & Finance',
                downloads: 1450,
                isFeatured: false,
                fileUrl: 'https://resources.loanhero.com/section-80e-guide.mp4',
                thumbnailUrl: 'assets/img/resource-tax.png',
            },
        }),
        prisma.communityResource.create({
            data: {
                title: 'Pre-Departure Checklist for International Students',
                description:
                    'Everything you need to do before leaving India — from loan disbursement verification, forex card setup, travel insurance, accommodation booking, to essential documents to carry. Printable PDF format.',
                type: 'checklist',
                category: 'Travel & Preparation',
                downloads: 980,
                isFeatured: false,
                fileUrl: 'https://resources.loanhero.com/pre-departure-checklist.pdf',
                downloadUrl: 'https://resources.loanhero.com/download/pre-departure-checklist.pdf',
            },
        }),
        prisma.communityResource.create({
            data: {
                title: 'Collateral Valuation Guide: Property Documents Explained',
                description:
                    'Understanding what banks look for when evaluating property as collateral for education loans. Covers property types accepted, valuation process, documentation needed, and tips to speed up approval.',
                type: 'guide',
                category: 'Documentation',
                downloads: 670,
                isFeatured: false,
                fileUrl: 'https://resources.loanhero.com/collateral-guide.pdf',
                downloadUrl: 'https://resources.loanhero.com/download/collateral-guide.pdf',
            },
        }),
        prisma.communityResource.create({
            data: {
                title: 'Monthly Budget Planner for Students Abroad',
                description:
                    'Excel/Google Sheets template to track your monthly expenses while studying abroad. Pre-filled with typical cost categories for USA, UK, Canada, and Australia. Includes EMI tracking and savings goals.',
                type: 'template',
                category: 'Repayment',
                downloads: 1120,
                isFeatured: true,
                fileUrl: 'https://resources.loanhero.com/budget-planner.xlsx',
                downloadUrl: 'https://resources.loanhero.com/download/budget-planner.xlsx',
                thumbnailUrl: 'assets/img/resource-budget.png',
            },
        }),
        prisma.communityResource.create({
            data: {
                title: 'Bank Interview Preparation Guide',
                description:
                    'Many banks conduct interviews before approving education loans. This guide covers the top 25 questions asked by major banks, ideal answers, and red flags to avoid during your loan interview.',
                type: 'guide',
                category: 'Application',
                downloads: 890,
                isFeatured: false,
                fileUrl: 'https://resources.loanhero.com/bank-interview-guide.pdf',
                downloadUrl: 'https://resources.loanhero.com/download/bank-interview-guide.pdf',
            },
        }),
    ]);
    console.log(`✅ Created ${resources.length} additional resources`);

    console.log('\n✅ Additional community data seeding completed successfully!');
}

async function main() {
    try {
        await seedAdditionalCommunityData();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
