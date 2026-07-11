const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const app = await prisma.loanApplication.findUnique({
    where: { id: '76a94a77-3f46-4ac3-9f56-e3a58ad7e2f6' },
    include: {
      user: {
        include: {
          onboardingApplication: true,
          financialProfile: true
        }
      }
    }
  });
  console.log(JSON.stringify(app, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
