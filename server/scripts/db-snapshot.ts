import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dbSnapshot() {
    try {
        console.log('\n========================================');
        console.log('     📦 DATABASE SNAPSHOT');
        console.log('========================================\n');

        // Users
        const users = await prisma.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true, role: true, mobile: true, createdAt: true, goal: true, studyDestination: true, admitStatus: true }
        });
        console.log(`👥 USERS (${users.length} total):`);
        users.forEach(u => {
            console.log(`  - [${u.role}] ${u.email} | Name: ${u.firstName ?? '-'} ${u.lastName ?? '-'} | Mobile: ${u.mobile} | Goal: ${u.goal ?? '-'} | Destination: ${u.studyDestination ?? '-'} | Admit: ${u.admitStatus ?? '-'}`);
        });

        // Loan Applications
        const loans = await prisma.loanApplication.findMany({
            select: { applicationNumber: true, userId: true, bank: true, loanType: true, amount: true, status: true, stage: true, date: true }
        });
        console.log(`\n💼 LOAN APPLICATIONS (${loans.length} total):`);
        loans.forEach(l => {
            console.log(`  - [${l.status}] #${l.applicationNumber.slice(0, 8)}... | Bank: ${l.bank} | Type: ${l.loanType} | Amount: Rs.${l.amount} | Stage: ${l.stage} | Date: ${l.date?.toISOString().slice(0, 10) ?? '-'}`);
        });

        // User Documents
        const userDocs = await prisma.userDocument.findMany({
            select: { userId: true, docType: true, status: true, uploaded: true, uploadedAt: true }
        });
        console.log(`\n📄 USER DOCUMENTS (${userDocs.length} total):`);
        userDocs.forEach(d => {
            console.log(`  - userId: ${d.userId.slice(0, 8)}... | DocType: ${d.docType} | Uploaded: ${d.uploaded} | Status: ${d.status}`);
        });

        // Application Documents
        const appDocs = await prisma.applicationDocument.findMany({
            select: { applicationId: true, docType: true, docName: true, status: true, digilockerTxId: true }
        });
        console.log(`\n📎 APPLICATION DOCUMENTS (${appDocs.length} total):`);
        appDocs.forEach(d => {
            console.log(`  - appId: ${d.applicationId.slice(0, 8)}... | ${d.docType}: ${d.docName} | Status: ${d.status} | DigiLocker: ${d.digilockerTxId ?? 'N/A'}`);
        });

        // Blogs
        const blogs = await prisma.blog.count();
        const publishedBlogs = await prisma.blog.count({ where: { status: 'published' } });
        console.log(`\n📝 BLOGS: ${blogs} total | ${publishedBlogs} published`);

        // Comments
        const comments = await prisma.comment.count();
        console.log(`💬 COMMENTS: ${comments} total`);

        // Tags
        const tags = await prisma.tag.findMany({ select: { name: true } });
        console.log(`🏷️  TAGS (${tags.length}): ${tags.map(t => t.name).join(', ')}`);

        // Forum Posts
        const forumPosts = await prisma.forumPost.count();
        const forumComments = await prisma.forumComment.count();
        console.log(`\n🗣️  FORUM POSTS: ${forumPosts} | FORUM COMMENTS: ${forumComments}`);

        // Mentors
        const mentors = await prisma.mentor.findMany({
            select: { name: true, university: true, country: true, isApproved: true, loanBank: true, loanAmount: true }
        });
        console.log(`\n🎓 MENTORS (${mentors.length} total):`);
        mentors.forEach(m => {
            console.log(`  - ${m.name} | ${m.university}, ${m.country} | Bank: ${m.loanBank} | Loan: ${m.loanAmount} | Approved: ${m.isApproved}`);
        });

        // Mentor Bookings
        const bookings = await prisma.mentorBooking.count();
        console.log(`📅 MENTOR BOOKINGS: ${bookings} total`);

        // Events
        const events = await prisma.communityEvent.count();
        const registrations = await prisma.eventRegistration.count();
        console.log(`\n🎪 EVENTS: ${events} | REGISTRATIONS: ${registrations}`);

        // Success Stories
        const stories = await prisma.successStory.count();
        const approvedStories = await prisma.successStory.count({ where: { isApproved: true } });
        console.log(`🌟 SUCCESS STORIES: ${stories} total | ${approvedStories} approved`);

        // Resources
        const resources = await prisma.communityResource.count();
        console.log(`📚 COMMUNITY RESOURCES: ${resources}`);

        // Referrals
        const referrals = await prisma.referral.findMany({
            select: { referrerId: true, refereeEmail: true, status: true }
        });
        console.log(`\n🔗 REFERRALS (${referrals.length} total):`);
        referrals.forEach(r => {
            console.log(`  - Referrer: ${r.referrerId.slice(0, 8)}... | Referee: ${r.refereeEmail ?? '-'} | Status: ${r.status}`);
        });

        // Reference Data
        const universities = await prisma.university.count();
        const banks = await prisma.bank.count();
        const countries = await prisma.country.count();
        const scholarships = await prisma.scholarship.count();
        const loanTypes = await prisma.loanType.count();
        const courses = await prisma.course.count();
        console.log(`\n📊 REFERENCE DATA:`);
        console.log(`  - Universities: ${universities}`);
        console.log(`  - Banks: ${banks}`);
        console.log(`  - Countries: ${countries}`);
        console.log(`  - Scholarships: ${scholarships}`);
        console.log(`  - Loan Types: ${loanTypes}`);
        console.log(`  - Courses: ${courses}`);

        // Audit Logs
        const auditLogs = await prisma.auditLog.count();
        console.log(`\n📋 AUDIT LOGS: ${auditLogs} entries`);

        // Admin Profiles
        const adminProfiles = await prisma.adminProfile.count();
        console.log(`🛡️  ADMIN PROFILES: ${adminProfiles}`);

        console.log('\n========================================\n');
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

dbSnapshot();
