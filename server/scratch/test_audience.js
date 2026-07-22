const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function testAudience() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['user', 'student'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studyDestination: true,
        targetUniversity: true,
      },
    });
    console.log(`Matched Audience Count: ${users.length}`);
    console.log('Sample matched users:', users.slice(0, 5));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testAudience();
