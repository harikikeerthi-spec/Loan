const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = "postgresql://postgres:VidhyaLOan2@db.mhhmqdbzsmwyizmvwtsx.supabase.co:5432/postgres";
  console.log('Testing connection to PostgreSQL using connection string:', connectionString.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Executing findMany and count concurrently...');
    const start = Date.now();
    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { analytics: true },
      }),
      prisma.campaign.count(),
    ]);

    console.log(`Success! Fetched ${data.length} campaigns. Total count: ${total}. Time taken: ${Date.now() - start}ms`);
  } catch (err) {
    console.error('Query failed with error:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
