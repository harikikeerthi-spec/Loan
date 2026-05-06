
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Creating table UniversityInquiry...');
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UniversityInquiry" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "mobile" TEXT NOT NULL,
        "universityName" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "UniversityInquiry_pkey" PRIMARY KEY ("id")
      );
    `;
        console.log('Table created or already exists.');

        // Add indexes
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_userId_idx" ON "UniversityInquiry"("userId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_email_idx" ON "UniversityInquiry"("email");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_mobile_idx" ON "UniversityInquiry"("mobile");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_universityName_idx" ON "UniversityInquiry"("universityName");`;
        console.log('Indexes created.');

        // Add foreign key
        try {
            await prisma.$executeRaw`ALTER TABLE "UniversityInquiry" ADD CONSTRAINT "UniversityInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`;
            console.log('Foreign key added.');
        } catch (e) {
            console.log('Foreign key might already exist:', e.message);
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
