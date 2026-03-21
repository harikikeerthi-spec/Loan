const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating initial user...');

    const email = 'testuser@example.com';
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`User ${email} already exists.`);
        return;
    }

    const user = await prisma.user.create({
        data: {
            email: email,
            password: 'password123', // In a real app this should be hashed
            mobile: '1234567890',
            firstName: 'Test',
            lastName: 'User',
            role: 'user'
        }
    });

    console.log(`Created user: ${user.email} with ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
