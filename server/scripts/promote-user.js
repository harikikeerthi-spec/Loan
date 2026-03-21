const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promote() {
    const email = 'chinnu2341@gmail.com';
    console.log(`Promoting ${email} to super_admin...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'super_admin' }
        });
        console.log('Success! User is now a super_admin.');
        console.log(user);
    } catch (e) {
        console.error('Promotion failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

promote();
