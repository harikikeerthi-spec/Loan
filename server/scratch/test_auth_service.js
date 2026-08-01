require('dotenv').config();
const { NestFactory } = require('@nestjs/core');

async function testAuthServiceDirectly() {
  console.log('--- INSTANTIATING NESTJS MODULE TO TEST AUTH SERVICE ---');
  const { AppModule } = require('../dist/app.module');
  const { AuthService } = require('../dist/auth/auth.service');

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  const testEmail = `student_direct_${Date.now()}@example.com`;

  console.log(`1. Calling updateUserDetails for NEW USER: ${testEmail}...`);
  const updateRes = await authService.updateUserDetails(
    testEmail,
    'Chinnu',
    'Kumar',
    '9876543210',
    '15-08-1998'
  );
  console.log('Update Result:', JSON.stringify(updateRes, null, 2));

  console.log(`2. Calling getUserDashboard for ${testEmail}...`);
  const dashRes = await authService.getUserDashboard(testEmail);
  console.log('Dashboard Result:', JSON.stringify(dashRes, null, 2));

  if (updateRes.success && dashRes.success && dashRes.user?.firstName === 'Chinnu') {
    console.log('🎉 SUCCESS: User profile completed and saved! ProfileGate will NOT redirect back to /user-details!');
  } else {
    console.error('❌ Failed profile completion test!');
  }

  await app.close();
}

testAuthServiceDirectly().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
