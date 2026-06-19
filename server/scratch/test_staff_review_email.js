const { EmailService } = require('../dist/auth/email.service');
require('dotenv').config();

async function testReviewEmail() {
  console.log('Instantiating EmailService...');
  const emailService = new EmailService();

  const mockApplication = {
    applicationNumber: 'APP987654',
    loanType: 'education',
    amount: 2500000,
    bank: 'HDFC Credila',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'mewir14095@aratrin.com',
  };

  console.log('Sending test staff review started email...');
  await emailService.sendStaffReviewStartedEmail(
    'mewir14095@aratrin.com',
    'Alice Smith',
    mockApplication
  );
  console.log('Finished test.');
}

testReviewEmail().catch(err => {
  console.error('Test review email failed:', err);
});
