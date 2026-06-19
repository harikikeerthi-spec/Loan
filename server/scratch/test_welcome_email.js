const { EmailService } = require('../dist/auth/email.service');
require('dotenv').config();

async function testWelcome() {
  console.log('Instantiating EmailService...');
  const emailService = new EmailService();

  console.log('Sending test welcome email...');
  await emailService.sendDashboardWelcomeEmail(
    'mewir14095@aratrin.com',
    'Mawa',
    'Broo'
  );
  console.log('Finished test.');
}

testWelcome().catch(err => {
  console.error('Test welcome failed:', err);
});
