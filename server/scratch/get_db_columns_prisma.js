const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Blog'
    `;
    console.log('Database columns for Blog table:', columns);
  } catch (err) {
    console.error('Error querying columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
