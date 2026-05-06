import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true, firstName: true }
        });

        console.log('\n📋 AVAILABLE USERS:');
        console.log('------------------');
        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            users.forEach(u => {
                console.log(`- ${u.email} (Role: ${u.role || 'user'})`);
            });
        }
        console.log('------------------\n');
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
