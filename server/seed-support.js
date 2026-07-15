const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSupport() {
  console.log('🌱 Starting Support Module seeding...');

  // 1. Teams
  const teams = [
    { name: 'IT Team', description: 'Technical issues, API errors, authentication', color: '#6366f1', email: 'it-support@vidyaloans.com' },
    { name: 'Finance Team', description: 'EVV, Payment, Disbursement, EMI queries', color: '#10b981', email: 'finance-support@vidyaloans.com' },
    { name: 'OCR Team', description: 'OCR document processing issues', color: '#f97316', email: 'ocr-support@vidyaloans.com' },
    { name: 'Integration Team', description: 'Digilocker, third-party integrations', color: '#a855f7', email: 'integration-support@vidyaloans.com' },
    { name: 'Loan Processing Team', description: 'Loan application queries', color: '#3b82f6', email: 'processing-support@vidyaloans.com' },
    { name: 'Document Team', description: 'Document verification and review', color: '#f59e0b', email: 'document-support@vidyaloans.com' },
  ];

  console.log('Seeding teams...');
  const seededTeams = [];
  for (const t of teams) {
    const team = await prisma.supportTeam.upsert({
      where: { name: t.name },
      update: { description: t.description, color: t.color, email: t.email },
      create: { name: t.name, description: t.description, color: t.color, email: t.email, isActive: true },
    });
    seededTeams.push(team);
  }
  console.log(`✅ ${seededTeams.length} teams seeded.`);

  // 2. Categories
  const categories = [
    { name: 'Loan Application', description: 'Loan application queries', color: '#3b82f6', teamName: 'Loan Processing Team' },
    { name: 'Bank Statement', description: 'Bank statement upload/verification', color: '#10b981', teamName: 'Finance Team' },
    { name: 'EVV', description: 'EVV verification issues', color: '#10b981', teamName: 'Finance Team' },
    { name: 'OCR', description: 'OCR recognition errors', color: '#f97316', teamName: 'OCR Team' },
    { name: 'Digilocker', description: 'Digilocker integration issues', color: '#a855f7', teamName: 'Integration Team' },
    { name: 'Document Verification', description: 'Document verification status', color: '#f59e0b', teamName: 'Document Team' },
    { name: 'University', description: 'University details/admit queries', color: '#6366f1', teamName: 'Loan Processing Team' },
    { name: 'Visa', description: 'Visa document assistance', color: '#ec4899', teamName: 'Loan Processing Team' },
    { name: 'Payment', description: 'Payment transactions and issues', color: '#10b981', teamName: 'Finance Team' },
    { name: 'Disbursement', description: 'Disbursement schedules and tracking', color: '#10b981', teamName: 'Finance Team' },
    { name: 'EMI', description: 'EMI payments and calculations', color: '#10b981', teamName: 'Finance Team' },
    { name: 'Authentication', description: 'Login, registration, password reset', color: '#6366f1', teamName: 'IT Team' },
    { name: 'Profile', description: 'Profile edits and info correction', color: '#6366f1', teamName: 'IT Team' },
    { name: 'API Error', description: 'API endpoint failures and bugs', color: '#ef4444', teamName: 'IT Team' },
    { name: 'Technical Issue', description: 'General platform technical errors', color: '#ef4444', teamName: 'IT Team' },
    { name: 'Others', description: 'Other miscellaneous queries', color: '#64748b', teamName: 'IT Team' },
  ];

  console.log('Seeding categories...');
  let categoriesCount = 0;
  for (const c of categories) {
    const matchingTeam = seededTeams.find(t => t.name === c.teamName);
    const slug = c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await prisma.supportCategory.upsert({
      where: { slug },
      update: { description: c.description, color: c.color, teamId: matchingTeam ? matchingTeam.id : null },
      create: {
        name: c.name,
        slug,
        description: c.description,
        color: c.color,
        teamId: matchingTeam ? matchingTeam.id : null,
        isActive: true,
        isDefault: true,
        sortOrder: 0,
      },
    });
    categoriesCount++;
  }
  console.log(`✅ ${categoriesCount} categories seeded.`);

  // 3. SLAs
  const slas = [
    { priority: 'critical', responseMinutes: 30, resolveMinutes: 240 },
    { priority: 'high', responseMinutes: 120, resolveMinutes: 480 },
    { priority: 'medium', responseMinutes: 240, resolveMinutes: 1440 },
    { priority: 'low', responseMinutes: 1440, resolveMinutes: 4320 },
  ];

  console.log('Seeding SLAs...');
  for (const s of slas) {
    await prisma.supportSLA.upsert({
      where: { priority: s.priority },
      update: { responseMinutes: s.responseMinutes, resolveMinutes: s.resolveMinutes },
      create: { priority: s.priority, responseMinutes: s.responseMinutes, resolveMinutes: s.resolveMinutes, isActive: true },
    });
  }
  console.log('✅ SLAs seeded.');

  console.log('🎉 Support Module seeding completed successfully!');
}

seedSupport()
  .catch(err => {
    console.error('❌ Error seeding support:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
