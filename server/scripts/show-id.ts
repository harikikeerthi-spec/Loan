import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showUserInfo() {
    const email = 'harikikeerthi@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        console.log('User ID:', user.id);
        console.log('Role:', user.role);
    } else {
        console.log('User not found');
    }
    await prisma.$disconnect();
}

showUserInfo();
