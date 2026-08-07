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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "UniversityInquiry_pkey" PRIMARY KEY ("id")
      );
    `;

        console.log('Creating table FastTrackApplication...');
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "FastTrackApplication" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "mobile" TEXT NOT NULL,
        "universityName" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "FastTrackApplication_pkey" PRIMARY KEY ("id")
      );
    `;

        console.log('Creating table CallbackRequest...');
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CallbackRequest" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "mobile" TEXT NOT NULL,
        "universityName" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
      );
    `;

        console.log('Tables created or already exist.');

        // Add indexes
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_userId_idx" ON "UniversityInquiry"("userId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_email_idx" ON "UniversityInquiry"("email");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_mobile_idx" ON "UniversityInquiry"("mobile");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UniversityInquiry_universityName_idx" ON "UniversityInquiry"("universityName");`;

        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "FastTrackApplication_userId_idx" ON "FastTrackApplication"("userId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "FastTrackApplication_email_idx" ON "FastTrackApplication"("email");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "FastTrackApplication_mobile_idx" ON "FastTrackApplication"("mobile");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "FastTrackApplication_universityName_idx" ON "FastTrackApplication"("universityName");`;

        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "CallbackRequest_userId_idx" ON "CallbackRequest"("userId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "CallbackRequest_email_idx" ON "CallbackRequest"("email");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "CallbackRequest_mobile_idx" ON "CallbackRequest"("mobile");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "CallbackRequest_universityName_idx" ON "CallbackRequest"("universityName");`;

        console.log('Indexes created.');

        // Add foreign keys
        try {
            await prisma.$executeRaw`ALTER TABLE "UniversityInquiry" ADD CONSTRAINT "UniversityInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`;
        } catch (e) {}
        try {
            await prisma.$executeRaw`ALTER TABLE "FastTrackApplication" ADD CONSTRAINT "FastTrackApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`;
        } catch (e) {}
        try {
            await prisma.$executeRaw`ALTER TABLE "CallbackRequest" ADD CONSTRAINT "CallbackRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`;
        } catch (e) {}

        console.log('Foreign keys created.');

        // Notify PostgREST to reload schema cache
        try {
            await prisma.$executeRaw`NOTIFY pgrst, 'reload schema';`;
            console.log('PostgREST schema cache reloaded.');
        } catch (e) {
            console.log('Could not reload pgrst schema:', e.message);
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
