const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');

// PrismaClient is generated in node_modules and reads DATABASE_URL from process.env
const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Blog'
    `);
    console.log('Database columns for Blog table:', columns);
  } catch (err) {
    console.error('Error querying columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
