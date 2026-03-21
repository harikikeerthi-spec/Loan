const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function dbSnapshot() {
    try {
        process.stdout.write('=== LIVE DATABASE SNAPSHOT ===\n\n');

        // USERS
        const users = await prisma.user.findMany({
            select: {
                email: true, firstName: true, lastName: true,
                mobile: true, role: true, createdAt: true,
                goal: true, studyDestination: true, courseName: true,
                targetUniversity: true, intakeSeason: true, gpa: true,
                workExp: true, englishTest: true, englishScore: true,
                entranceTest: true, entranceScore: true, budget: true,
                loanAmount: true, admitStatus: true, pincode: true,
                referralCode: true, referredById: true
            }
        });
        process.stdout.write(`USERS (${users.length} total):\n`);
        users.forEach((u, i) => {
            process.stdout.write(`  [${i + 1}] Email        : ${u.email}\n`);
            process.stdout.write(`      Role         : ${u.role}\n`);
            process.stdout.write(`      Name         : ${u.firstName || '-'} ${u.lastName || '-'}\n`);
            process.stdout.write(`      Mobile       : ${u.mobile}\n`);
            process.stdout.write(`      Goal         : ${u.goal || '-'}\n`);
            process.stdout.write(`      Destination  : ${u.studyDestination || '-'}\n`);
            process.stdout.write(`      Course       : ${u.courseName || '-'}\n`);
            process.stdout.write(`      University   : ${u.targetUniversity || '-'}\n`);
            process.stdout.write(`      Intake       : ${u.intakeSeason || '-'}\n`);
            process.stdout.write(`      GPA          : ${u.gpa || '-'}\n`);
            process.stdout.write(`      Work Exp     : ${u.workExp != null ? u.workExp + ' yrs' : '-'}\n`);
            process.stdout.write(`      English Test : ${u.englishTest || '-'} - ${u.englishScore || '-'}\n`);
            process.stdout.write(`      Entrance Test: ${u.entranceTest || '-'} - ${u.entranceScore || '-'}\n`);
            process.stdout.write(`      Budget       : ${u.budget || '-'}\n`);
            process.stdout.write(`      Loan Need    : ${u.loanAmount || '-'}\n`);
            process.stdout.write(`      Admit Status : ${u.admitStatus || '-'}\n`);
            process.stdout.write(`      Pincode      : ${u.pincode || '-'}\n`);
            process.stdout.write(`      Referral Code: ${u.referralCode || '-'}\n`);
            process.stdout.write(`      Referred By  : ${u.referredById || '-'}\n`);
            process.stdout.write(`      Joined       : ${u.createdAt.toISOString().slice(0, 10)}\n\n`);
        });

        // LOAN APPLICATIONS
        const loans = await prisma.loanApplication.findMany({
            select: {
                applicationNumber: true, bank: true, loanType: true, amount: true,
                tenure: true, status: true, stage: true, progress: true,
                firstName: true, lastName: true, email: true, phone: true,
                city: true, state: true, pincode: true,
                employmentType: true, annualIncome: true, workExperience: true,
                universityName: true, courseName: true, admissionStatus: true,
                hasCoApplicant: true, hasCollateral: true, submittedAt: true,
                gender: true, nationality: true
            }
        });
        process.stdout.write(`LOAN APPLICATIONS (${loans.length} total):\n`);
        loans.forEach((l, i) => {
            process.stdout.write(`  [${i + 1}] App No      : ${l.applicationNumber}\n`);
            process.stdout.write(`      Status      : ${l.status} | Stage: ${l.stage} | Progress: ${l.progress}%\n`);
            process.stdout.write(`      Applicant   : ${l.firstName || '-'} ${l.lastName || '-'}\n`);
            process.stdout.write(`      Email/Phone : ${l.email || '-'} | ${l.phone || '-'}\n`);
            process.stdout.write(`      Gender/Nat. : ${l.gender || '-'} / ${l.nationality || '-'}\n`);
            process.stdout.write(`      Bank        : ${l.bank} | Type: ${l.loanType}\n`);
            process.stdout.write(`      Amount      : Rs.${l.amount} | Tenure: ${l.tenure || '-'} months\n`);
            process.stdout.write(`      Location    : ${l.city || '-'}, ${l.state || '-'} - ${l.pincode || '-'}\n`);
            process.stdout.write(`      Employment  : ${l.employmentType || '-'} | Income: Rs.${l.annualIncome || '-'}\n`);
            process.stdout.write(`      Work Exp    : ${l.workExperience || '-'} yrs\n`);
            process.stdout.write(`      University  : ${l.universityName || '-'} | Course: ${l.courseName || '-'}\n`);
            process.stdout.write(`      Admission   : ${l.admissionStatus || '-'}\n`);
            process.stdout.write(`      Co-Applicant: ${l.hasCoApplicant} | Collateral: ${l.hasCollateral}\n`);
            process.stdout.write(`      Submitted   : ${l.submittedAt ? l.submittedAt.toISOString().slice(0, 10) : 'Draft'}\n\n`);
        });

        // USER DOCUMENTS
        const userDocGroups = await prisma.userDocument.groupBy({ by: ['docType', 'status'], _count: { id: true } });
        const totalUserDocs = userDocGroups.reduce((s, d) => s + d._count.id, 0);
        process.stdout.write(`USER DOCUMENTS (${totalUserDocs} total):\n`);
        userDocGroups.forEach(d => {
            process.stdout.write(`  DocType: ${d.docType.padEnd(15)} Status: ${d.status.padEnd(12)} Count: ${d._count.id}\n`);
        });
        process.stdout.write('\n');

        // APPLICATION DOCUMENTS
        const appDocGroups = await prisma.applicationDocument.groupBy({ by: ['docType', 'status'], _count: { id: true } });
        const totalAppDocs = appDocGroups.reduce((s, d) => s + d._count.id, 0);
        const digiCount = await prisma.applicationDocument.count({ where: { digilockerTxId: { not: null } } });
        process.stdout.write(`APPLICATION DOCUMENTS (${totalAppDocs} total | ${digiCount} DigiLocker verified):\n`);
        appDocGroups.forEach(d => {
            process.stdout.write(`  DocType: ${d.docType.padEnd(20)} Status: ${d.status.padEnd(12)} Count: ${d._count.id}\n`);
        });
        process.stdout.write('\n');

        // BLOGS
        const blogGroups = await prisma.blog.groupBy({ by: ['status'], _count: { id: true } });
        const totalComments = await prisma.comment.count();
        const tags = await prisma.tag.findMany({ select: { name: true } });
        process.stdout.write(`BLOGS:\n`);
        blogGroups.forEach(b => process.stdout.write(`  Status: ${b.status.padEnd(12)} Count: ${b._count.id}\n`));
        process.stdout.write(`  Comments: ${totalComments}\n`);
        process.stdout.write(`  Tags (${tags.length}): ${tags.map(t => t.name).join(', ')}\n\n`);

        // FORUM
        const forumGroups = await prisma.forumPost.groupBy({ by: ['category'], _count: { id: true } });
        const totalForumComments = await prisma.forumComment.count();
        process.stdout.write(`FORUM:\n`);
        forumGroups.forEach(f => process.stdout.write(`  Category: ${f.category.padEnd(18)} Posts: ${f._count.id}\n`));
        process.stdout.write(`  Total Forum Comments: ${totalForumComments}\n\n`);

        // MENTORS
        const mentors = await prisma.mentor.findMany({
            select: { name: true, university: true, country: true, loanBank: true, loanAmount: true, isApproved: true, rating: true, studentsMentored: true }
        });
        const bookings = await prisma.mentorBooking.count();
        process.stdout.write(`MENTORS (${mentors.length} total | ${bookings} bookings):\n`);
        mentors.forEach(m => {
            process.stdout.write(`  ${m.name} | ${m.university}, ${m.country} | Bank: ${m.loanBank} | Rs.${m.loanAmount} | Rating: ${m.rating} | Approved: ${m.isApproved}\n`);
        });
        process.stdout.write('\n');

        // EVENTS
        const events = await prisma.communityEvent.findMany({ select: { title: true, type: true, date: true, attendeesCount: true } });
        const regs = await prisma.eventRegistration.count();
        process.stdout.write(`EVENTS (${events.length} total | ${regs} registrations):\n`);
        events.forEach(e => process.stdout.write(`  ${e.title} | Type: ${e.type} | Date: ${e.date} | Attendees: ${e.attendeesCount}\n`));
        process.stdout.write('\n');

        // SUCCESS STORIES
        const storyGroups = await prisma.successStory.groupBy({ by: ['isApproved'], _count: { id: true } });
        process.stdout.write(`SUCCESS STORIES:\n`);
        storyGroups.forEach(s => process.stdout.write(`  ${s.isApproved ? 'Approved' : 'Pending'}: ${s._count.id}\n`));
        process.stdout.write('\n');

        // COMMUNITY RESOURCES
        const resourceGroups = await prisma.communityResource.groupBy({ by: ['type'], _count: { id: true } });
        process.stdout.write(`COMMUNITY RESOURCES:\n`);
        resourceGroups.forEach(r => process.stdout.write(`  Type: ${r.type.padEnd(12)} Count: ${r._count.id}\n`));
        process.stdout.write('\n');

        // REFERRALS
        const referralGroups = await prisma.referral.groupBy({ by: ['status'], _count: { id: true } });
        process.stdout.write(`REFERRALS:\n`);
        referralGroups.forEach(r => process.stdout.write(`  Status: ${r.status.padEnd(12)} Count: ${r._count.id}\n`));
        process.stdout.write('\n');

        // AUDIT LOGS
        const auditGroups = await prisma.auditLog.groupBy({ by: ['entityType', 'action'], _count: { id: true } });
        process.stdout.write(`AUDIT LOGS:\n`);
        auditGroups.forEach(a => process.stdout.write(`  ${a.entityType}.${a.action.padEnd(10)} Count: ${a._count.id}\n`));
        process.stdout.write('\n');

        // REFERENCE DATA
        const [uniCount, bankCount, countryCount, schCount, ltCount, courseCount] = await Promise.all([
            prisma.university.count(), prisma.bank.count(), prisma.country.count(),
            prisma.scholarship.count(), prisma.loanType.count(), prisma.course.count()
        ]);
        process.stdout.write(`REFERENCE DATA:\n`);
        process.stdout.write(`  Universities: ${uniCount}\n`);
        process.stdout.write(`  Banks       : ${bankCount}\n`);
        process.stdout.write(`  Countries   : ${countryCount}\n`);
        process.stdout.write(`  Scholarships: ${schCount}\n`);
        process.stdout.write(`  Loan Types  : ${ltCount}\n`);
        process.stdout.write(`  Courses     : ${courseCount}\n\n`);

        const adminCount = await prisma.adminProfile.count();
        process.stdout.write(`ADMIN PROFILES: ${adminCount}\n\n`);
        process.stdout.write('=== SNAPSHOT COMPLETE ===\n');
    } catch (error) {
        process.stdout.write('\nERROR: ' + error.message + '\n');
    } finally {
        await prisma.$disconnect();
    }
}

dbSnapshot();
