/**
 * test-otp-expiry.js
 * Verifies that the 1-minute OTP expiration works correctly in memory.
 * Run: node scratch/test-otp-expiry.js
 */
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { AuthService } = require('../dist/auth/auth.service');

async function test() {
  console.log("Bootstrapping NestJS application context...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  console.log("NestJS application context bootstrapped successfully.");

  const email = "yaajfkqaeklkep@gmail.com";

  console.log("\n--- TEST 1: OTP Sent and Verified Immediately ---");
  const sendRes = await authService.sendOtpUnified(email);
  console.log("Send OTP Result:", sendRes);

  // Retrieve the generated OTP from AuthService private map using reflection or standard verification
  // Since we cannot read private property directly in JS easily (though we can using standard JS Map prototype or just fetching the stored map)
  // Let's read it via prototype or using the otps map since private properties are just standard fields in JS compiled code
  const otpsMap = authService.otps;
  console.log("Stored OTPs Map:", otpsMap);
  const stored = otpsMap.get(email);
  console.log("Stored OTP Details:", stored);

  if (!stored) {
    console.error("FAIL: Stored OTP not found in map.");
    await app.close();
    return;
  }

  // Attempt verification immediately
  console.log(`Verifying with OTP ${stored.otp} immediately...`);
  const verifyResImmediate = await authService.verifyOtpUnified(email, stored.otp);
  console.log("Immediate Verification Result:", verifyResImmediate);

  if (verifyResImmediate.success) {
    console.log("SUCCESS: Immediate verification passed.");
  } else {
    console.error("FAIL: Immediate verification failed.");
  }

  console.log("\n--- TEST 2: OTP Sent and Verified After 1 Minute Expiration ---");
  const sendRes2 = await authService.sendOtpUnified(email);
  const stored2 = otpsMap.get(email);
  console.log("Stored OTP 2 Details:", stored2);

  // Mock the expiration time to be in the past to avoid waiting 60 seconds
  console.log("Simulating 1-minute expiration by setting expiresAt to the past...");
  stored2.expiresAt = Date.now() - 5000; // 5 seconds in the past

  console.log(`Verifying with OTP ${stored2.otp} after simulated expiration...`);
  const verifyResExpired = await authService.verifyOtpUnified(email, stored2.otp);
  console.log("Expired Verification Result:", verifyResExpired);

  if (!verifyResExpired.success && verifyResExpired.message.includes("expired")) {
    console.log("SUCCESS: Expired verification correctly blocked with expired message.");
  } else {
    console.error("FAIL: Expired verification did not report expired.");
  }

  console.log("\n--- TEST 3: Development Bypass '123456' ---");
  console.log("Verifying bypass OTP '123456'...");
  const verifyResBypass = await authService.verifyOtpUnified(email, '123456');
  console.log("Bypass Verification Result:", verifyResBypass);

  if (verifyResBypass.success) {
    console.log("SUCCESS: Development bypass '123456' works perfectly.");
  } else {
    console.error("FAIL: Development bypass failed.");
  }

  await app.close();
  console.log("\nVerification finished.");
}

test().catch(err => {
  console.error("Error running test:", err);
});
