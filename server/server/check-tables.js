
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('--- Tables ---');
        tables.forEach(t => console.log(t.table_name));
        console.log('--------------');
    } catch (e) {
        console.error('Error fetching tables:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
