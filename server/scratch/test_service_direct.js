require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');

async function testDirectService() {
  console.log('--- TESTING USERS SERVICE DIRECTLY ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const { UsersService } = require('../src/users/users.service');
  const usersService = app.get(UsersService);

  const testEmail = `student_direct_${Date.now()}@example.com`;

  console.log(`Calling updateUserDetails for ${testEmail}...`);
  const result = await usersService.updateUserDetails(
    testEmail,
    'John',
    'Doe',
    '9876543210',
    '1997-01-01',
    'Fall 2026',
    undefined,
    '400001',
    'Columbia University',
    'United States',
    'John Father',
    'Jane Mother',
    { fatherAadhar: '111122223333', motherAadhar: '444455556666' },
    { name: 'John CoApp', relation: 'Father' },
    { ssc: { institute: 'St. Marys', percentage: '90' }, gpa: 3.9 },
    undefined
  );

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result && result.id && !result.error) {
    console.log('🎉 SUCCESS: User details updated directly in DB with zero PGRST204 errors!');
  } else {
    console.error('❌ Failed:', result);
  }

  await app.close();
}

testDirectService().catch(err => {
  console.error('Error running direct test:', err);
  process.exit(1);
});
