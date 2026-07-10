const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { AuthService } = require('../dist/auth/auth.service');
const { UsersService } = require('../dist/users/users.service');
const jwt = require('jsonwebtoken');

async function run() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);

  console.log('\n--- VERIFICATION 1: Initial Login Token Generation ---');
  // Create a mock user or find one in DB
  const testEmail = 'staff_test_expiry@example.com';
  let testUser = await usersService.findOne(testEmail);
  if (!testUser) {
    console.log(`Creating test user ${testEmail}...`);
    testUser = await usersService.create({
      email: testEmail,
      firstName: 'Test',
      lastName: 'Staff',
      role: 'staff'
    });
  }

  // Generate tokens initially
  const tokens = await authService.generateTokens(testUser);
  console.log('Tokens generated successfully.');
  console.log('Access Token exists:', !!tokens.access_token);
  console.log('Refresh Token exists:', !!tokens.refresh_token);

  // Decode refresh token to verify loginAt claim is present
  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';
  const decodedRefresh = jwt.verify(tokens.refresh_token, secret);
  console.log('Decoded Refresh Token payload loginAt:', decodedRefresh.loginAt);
  const initialLoginAt = decodedRefresh.loginAt;
  
  if (initialLoginAt) {
    console.log('SUCCESS: loginAt claim is set successfully.');
  } else {
    console.error('ERROR: loginAt claim is missing.');
  }

  console.log('\n--- VERIFICATION 2: Token Refresh Behavior ---');
  console.log('Waiting 2 seconds to simulate elapsed time...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Perform refresh
  const refreshedTokens = await authService.refreshTokens(tokens.refresh_token);
  console.log('Tokens refreshed successfully.');

  const decodedRefreshedRefresh = jwt.verify(refreshedTokens.refresh_token, secret);
  console.log('New Refresh Token payload loginAt:', decodedRefreshedRefresh.loginAt);
  
  if (decodedRefreshedRefresh.loginAt === initialLoginAt) {
    console.log('SUCCESS: loginAt claim was successfully carried over in refreshed tokens.');
  } else {
    console.error('ERROR: loginAt claim changed or was not carried over.');
  }

  // Verify that the expiresIn was reduced (meaning remaining duration has decreased)
  const originalRemaining = decodedRefresh.exp - decodedRefresh.iat;
  const newRemaining = decodedRefreshedRefresh.exp - decodedRefreshedRefresh.iat;
  console.log(`Original token lifetime duration (seconds): ${originalRemaining}`);
  console.log(`New token remaining duration (seconds): ${newRemaining}`);

  if (newRemaining < originalRemaining) {
    console.log('SUCCESS: New token remaining lifetime has correctly decreased relative to initial login.');
  } else {
    console.error('ERROR: New token lifetime did not decrease.');
  }

  console.log('\n--- VERIFICATION 3: Expiration Enforcement ---');
  // Simulate an expired session by passing an old loginAt timestamp (24h 5s ago)
  const twentyFourHoursAgoMs = Date.now() - (24 * 60 * 60 * 1000 + 5000);
  console.log('Generating tokens with simulated loginAt from 24h 5s ago...');
  try {
    await authService.generateTokens(testUser, twentyFourHoursAgoMs);
    console.error('ERROR: Should have thrown UnauthorizedException for expired login session!');
  } catch (err) {
    console.log('SUCCESS: Correctly threw error for expired session:', err.message);
  }

  await app.close();
  console.log('\nAll token expiry tests completed.');
}

run().catch(async (err) => {
  console.error('Test execution failed:', err);
});
