
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            firstName: true,
            lastName: true,
        },
    });

    console.log('--- REGISTERED USERS in User Table ---');
    if (users.length === 0) {
        console.log('No registered users found.');
    } else {
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (Name: ${user.firstName || 'Unknown'} ${user.lastName || ''})`);
        });
    }
    console.log('--------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
