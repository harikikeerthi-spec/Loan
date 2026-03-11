const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true }
        });
        console.log('Current Users in Supabase:');
        console.table(users);
    } catch (e) {
        console.error('Failed to list users:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
