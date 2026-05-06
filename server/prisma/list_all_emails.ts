
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { email: true } });
    const mentors = await prisma.mentor.findMany({ select: { email: true } });
    const stories = await prisma.successStory.findMany({ select: { email: true } });

    console.log('--- USERS (Regsitered Login Accounts) ---');
    if (users.length === 0) console.log('(No registered users)');
    users.forEach(u => console.log(`User: ${u.email}`));

    console.log('\n--- MENTORS (Community / Seed Data) ---');
    if (mentors.length === 0) console.log('(No mentors)');
    mentors.forEach(m => console.log(`Mentor: ${m.email}`));

    console.log('\n--- SUCCESS STORIES (Community / Seed Data) ---');
    if (stories.length === 0) console.log('(No success stories)');
    stories.forEach(s => console.log(`Story: ${s.email}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
