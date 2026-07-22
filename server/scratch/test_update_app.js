const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function testUpdate() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const appId = '1fbcc1c6-d01d-443c-b303-a17e480ee640';
    console.log(`Checking application ${appId}...`);
    const app = await prisma.loanApplication.findUnique({
      where: { id: appId },
    });
    console.log('Application found:', app ? { id: app.id, bank: app.bank, country: app.country, universityName: app.universityName } : 'Not found');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testUpdate();
