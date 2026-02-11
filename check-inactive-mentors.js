
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inactiveMentors = await prisma.mentor.count({ where: { isActive: false } });
    console.log(`Inactive Mentors: ${inactiveMentors}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
