import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommunityData() {
    console.log('🌱 Seeding community data...');

    // Clean up existing data to avoid duplicates
    try {
        await prisma.mentor.deleteMany();
        await prisma.communityEvent.deleteMany();
        await prisma.successStory.deleteMany();
        await prisma.communityResource.deleteMany();
        console.log('🧹 Cleaned up existing community data');
    } catch (e) {
        console.log(
            '⚠️ Cleanup failed (tables might not exist yet), proceeding...',
        );
    }

    // Seed Mentors
    console.log('Creating mentors...');
    const mentors = await Promise.all([
        prisma.mentor.create({
            data: {
                name: 'Arjun Patel',
                email: 'arjun.patel@example.com',
                university: 'Harvard Business School',
                degree: 'MBA',
                country: 'USA',
                category: 'MBA',
                loanBank: 'HDFC',
                loanAmount: '₹75,00,000',
                loanType: 'Non-Collateral',
                interestRate: '8.5%',
                bio: 'Successfully secured a non-collateral education loan for Harvard MBA. Happy to guide students through the loan application process and share insights about studying in the US.',
                expertise: ['Non-Collateral', 'MBA', 'USA', 'HDFC'],
                rating: 4.9,
                studentsMentored: 47,
                isActive: true,
                isApproved: true,
                image: 'https://i.pravatar.cc/150?img=11', // Replaced local asset with web URL
            },
        }),
        prisma.mentor.create({
            data: {
                name: 'Sneha Iyer',
                email: 'sneha.iyer@example.com',
                university: 'Stanford University',
                degree: 'MS Computer Science',
                country: 'USA',
                category: 'Computer Science',
                loanBank: 'SBI',
                loanAmount: '₹40,00,000',
                loanType: 'Scholar Loan',
                interestRate: '7.5%',
                bio: 'Got admitted to Stanford for MS CS and secured SBI Scholar Loan. I can help with top university applications, loan processes, and visa coordination.',
                expertise: ['Top Universities', 'Computer Science', 'SBI', 'USA'],
                rating: 5.0,
                studentsMentored: 68,
                isActive: true,
                isApproved: true,
                image: 'https://i.pravatar.cc/150?img=5',
            },
        }),
        prisma.mentor.create({
            data: {
                name: 'Vikram Shah',
                email: 'vikram.shah@example.com',
                university: 'University of Cambridge',
                degree: 'Engineering',
                country: 'UK',
                category: 'Engineering',
                loanBank: 'ICICI',
                loanAmount: '₹55,00,000',
                interestRate: '8.2%',
                bio: 'Engineering graduate from Cambridge. Navigated the complex UK loan and visa process. Can help with UK universities and ICICI loan applications.',
                expertise: ['UK', 'Engineering', 'ICICI'],
                rating: 4.8,
                studentsMentored: 35,
                isActive: true,
                isApproved: true,
                image: 'https://i.pravatar.cc/150?img=13',
            },
        }),
        prisma.mentor.create({
            data: {
                name: 'Meera Kapoor',
                email: 'meera.kapoor@example.com',
                university: 'University of Toronto',
                degree: 'Medicine',
                country: 'Canada',
                category: 'Medical',
                loanBank: 'Axis Bank',
                loanAmount: '₹60,00,000',
                interestRate: '8.0%',
                bio: 'Medical student at University of Toronto. Successfully secured Axis Bank education loan for medical programs in Canada.',
                expertise: ['Canada', 'Medical', 'Axis Bank'],
                rating: 4.9,
                studentsMentored: 38,
                isActive: true,
                isApproved: true,
                image: 'https://i.pravatar.cc/150?img=9',
            },
        }),
    ]);
    console.log(`✅ Created ${mentors.length} mentors`);

    // Seed Events
    console.log('Creating events...');
    const events = await Promise.all([
        prisma.communityEvent.create({
            data: {
                title: 'How to Get SBI Education Loan Approved in 15 Days',
                description:
                    'Join Rajesh Kumar, former SBI loan officer, as he shares insider tips on fast-tracking your education loan application with proper documentation and strategies.',
                type: 'webinar',
                date: new Date('2026-02-15T18:00:00Z').toISOString(),
                time: '18:00',
                duration: 60,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'Student Visa + Education Loan: Complete Guide',
                description:
                    'Immigration experts discuss how to coordinate loan disbursement with visa timelines for UK, USA, Canada, and Australia.',
                type: 'qa',
                date: new Date('2026-02-18T17:30:00Z').toISOString(),
                time: '17:30',
                duration: 90,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: 'Virtual Coffee Chat: Connect with Alumni',
                description:
                    'Casual networking session with students who have successfully repaid their loans. Ask questions, get advice, make connections.',
                type: 'networking',
                date: new Date('2026-02-22T11:00:00Z').toISOString(),
                time: '11:00',
                duration: 45,
            },
        }),
        prisma.communityEvent.create({
            data: {
                title: "Collateral vs Non-Collateral Loans: What's Best for You?",
                description:
                    'Financial advisors break down the pros and cons of secured vs unsecured education loans, helping you make the right choice.',
                type: 'webinar',
                date: new Date('2026-02-25T19:00:00Z').toISOString(),
                time: '19:00',
                duration: 60,
            },
        }),
    ]);
    console.log(`✅ Created ${events.length} events`);

    // Seed Success Stories
    console.log('Creating success stories...');
    const stories = await Promise.all([
        prisma.successStory.create({
            data: {
                name: 'Rahul Verma',
                email: 'rahul.verma@example.com',
                university: 'University of Oxford',
                country: 'UK',
                degree: 'Master of Public Policy',
                loanAmount: '4000000',
                bank: 'HDFC Bank',
                story:
                    "My journey to securing an education loan was challenging but rewarding. LoanHero's mentorship program connected me with an alumni who guided me to prepare all documents and negotiate better interest rates. Now pursuing my dream at Oxford!",
                isApproved: true,
                isFeatured: true,
                image: 'https://i.pravatar.cc/150?img=11',
            },
        }),
        prisma.successStory.create({
            data: {
                name: 'Priya Sharma',
                email: 'priya.sharma2@example.com',
                university: 'MIT',
                country: 'USA',
                degree: 'MBA',
                loanAmount: '7500000',
                bank: 'ICICI Bank',
                story:
                    'Getting into MIT was a dream come true, and ICICI made the financing possible. The process was smooth and I appreciated the transparent communication. I landed a great job and repaid the entire loan 2 years early with no prepayment penalties!',
                isApproved: true,
                isFeatured: true,
                image: 'https://i.pravatar.cc/150?img=5',
            },
        }),
        prisma.successStory.create({
            data: {
                name: 'Karan Singh',
                email: 'karan.singh@example.com',
                university: 'University of Melbourne',
                country: 'Australia',
                degree: 'Engineering',
                loanAmount: '5000000',
                bank: 'SBI',
                story:
                    "SBI's education loan for Australia was exactly what I needed. The interest moratorium during my study period was a huge relief. Now working in Melbourne and making regular EMI payments.",
                isApproved: true,
                isFeatured: false,
                image: 'https://i.pravatar.cc/150?img=3',
            },
        }),
    ]);
    console.log(`✅ Created ${stories.length} success stories`);

    console.log('✅ Community data seeding completed successfully!');
}

async function main() {
    try {
        await seedCommunityData();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
