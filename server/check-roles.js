
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true, firstName: true }
        });
        console.log('--- User Roles ---');
        users.forEach(u => console.log(`${u.email} (${u.firstName}): ${u.role}`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
