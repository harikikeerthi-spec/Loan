const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function run() {
    // Users
    const users = await prisma.user.findMany({
        select: {
            email: true, role: true, firstName: true, lastName: true, mobile: true,
            goal: true, studyDestination: true, courseName: true, targetUniversity: true,
            intakeSeason: true, gpa: true, workExp: true, englishTest: true,
            englishScore: true, entranceTest: true, entranceScore: true, budget: true,
            loanAmount: true, admitStatus: true, referralCode: true, createdAt: true
        }
    });
    console.log('--- USERS: ' + users.length + ' ---');
    users.forEach(function (u, i) { console.log('[' + (i + 1) + ']', JSON.stringify(u, null, 2)); });

    // Counts
    const loans = await prisma.loanApplication.count();
    const loanList = await prisma.loanApplication.findMany({ select: { applicationNumber: true, bank: true, loanType: true, amount: true, status: true, stage: true, firstName: true, email: true, universityName: true, courseName: true } });
    console.log('--- LOAN APPLICATIONS: ' + loans + ' ---');
    loanList.forEach(function (l, i) { console.log('[' + (i + 1) + ']', JSON.stringify(l)); });

    const userDocs = await prisma.userDocument.findMany({ select: { docType: true, status: true, uploaded: true } });
    console.log('--- USER DOCUMENTS: ' + userDocs.length + ' ---');
    userDocs.forEach(function (d) { console.log(JSON.stringify(d)); });

    const blogs = await prisma.blog.count();
    const draftBlogs = await prisma.blog.count({ where: { status: 'draft' } });
    const publishedBlogs = await prisma.blog.count({ where: { status: 'published' } });
    const tags = await prisma.tag.findMany({ select: { name: true } });
    console.log('--- BLOGS: ' + blogs + ' (draft:' + draftBlogs + ', published:' + publishedBlogs + ') ---');
    console.log('Tags:', tags.map(function (t) { return t.name; }).join(', '));

    const mentors = await prisma.mentor.count();
    const uniCount = await prisma.university.count();
    const bankCount = await prisma.bank.count();
    const countryCount = await prisma.country.count();
    const loanTypeCount = await prisma.loanType.count();
    const courseCount = await prisma.course.count();
    const scholarshipCount = await prisma.scholarship.count();
    const forumPosts = await prisma.forumPost.count();
    const successStories = await prisma.successStory.count();
    const events = await prisma.communityEvent.count();
    const resources = await prisma.communityResource.count();
    const referrals = await prisma.referral.count();
    const auditLogs = await prisma.auditLog.count();
    const adminProfiles = await prisma.adminProfile.count();

    console.log('--- COUNTS ---');
    console.log('Mentors:', mentors);
    console.log('Universities:', uniCount);
    console.log('Banks:', bankCount);
    console.log('Countries:', countryCount);
    console.log('LoanTypes:', loanTypeCount);
    console.log('Courses:', courseCount);
    console.log('Scholarships:', scholarshipCount);
    console.log('ForumPosts:', forumPosts);
    console.log('SuccessStories:', successStories);
    console.log('Events:', events);
    console.log('Resources:', resources);
    console.log('Referrals:', referrals);
    console.log('AuditLogs:', auditLogs);
    console.log('AdminProfiles:', adminProfiles);

    await prisma.$disconnect();
}

run().catch(function (e) { console.error('ERROR:', e.message); process.exit(1); });
