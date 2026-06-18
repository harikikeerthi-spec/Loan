const { EmailService } = require('../dist/auth/email.service');
require('dotenv').config();

async function testEmail() {
  console.log('Testing Email Service methods...');
  const emailService = new EmailService();

  const mockApplication = {
    applicationNumber: 'APP123456',
    loanType: 'education',
    amount: 1500000,
    tenure: 120,
    universityName: 'Stanford University',
    courseName: 'Master of Science in Computer Science',
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    progress: 15
  };

  console.log('\n--- 1. Submission Details Email ---');
  await emailService.sendLoanSubmissionEmail(
    'johndoe@example.com',
    'John Doe',
    'HDFC Credila',
    mockApplication
  );

  console.log('\n--- 2. Tracking Timeline Email ---');
  await emailService.sendLoanTrackingEmail(
    'johndoe@example.com',
    'John Doe',
    'HDFC Credila',
    mockApplication
  );

  console.log('\n--- 3. Sent to Bank Email ---');
  await emailService.sendApplicationSentToBankEmail(
    'johndoe@example.com',
    'John Doe',
    'HDFC Credila',
    mockApplication
  );

  console.log('\n--- 4. Accepted by Bank Email ---');
  await emailService.sendApplicationAcceptedByBankEmail(
    'johndoe@example.com',
    'John Doe',
    'HDFC Credila',
    mockApplication,
    { sanctionAmount: 1400000, interestRate: 9.25, tenure: 180 }
  );

  console.log('\n--- 5. Rejected by Bank Email ---');
  await emailService.sendApplicationRejectedByBankEmail(
    'johndoe@example.com',
    'John Doe',
    'HDFC Credila',
    'Co-applicant CIBIL score is too low.'
  );

  console.log('\nAll email tests completed successfully!');
}

testEmail().catch(err => {
  console.error('Test failed:', err);
});
