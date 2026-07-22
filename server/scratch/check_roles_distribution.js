const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function checkUsers() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, role: true, firstName: true }
    });
    console.log(`Total users in DB: ${allUsers.length}`);
    console.log('User roles distribution:', allUsers.map(u => ({ email: u.email, role: u.role, name: u.firstName })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUsers();
