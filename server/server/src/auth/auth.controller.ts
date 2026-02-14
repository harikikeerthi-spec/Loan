import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Check if a user exists in the system
   * GET /auth/check-user/:email
   * @param email - User's email address
   * @returns { exists: boolean, message: string }
   */
  @Get('check-user/:email')
  async checkUserExists(@Param('email') email: string) {
    return this.authService.checkUserExists(email);
  }

  // ==================== UNIFIED OTP FLOW ====================

  /**
   * Step 1: Send OTP to email (Works for both new and existing users)
   * POST /auth/send-otp
   * @body email: string (required)
   * @returns { success: boolean, message: string, userExists: boolean }
   */
  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
    return this.authService.sendOtpUnified(body.email);
  }

  /**
   * Step 2: Verify OTP and determine user flow
   * POST /auth/verify-otp
   * @body email: string (required), otp: string (required, 6 digits)
   * @returns {
   *   success: boolean,
   *   access_token: string,
   *   userExists: boolean,
   *   hasUserDetails: boolean,
   *   message: string
   * }
   *
   * Flow:
   * - If userExists: true && hasUserDetails: true → Navigate to homepage
   * - If userExists: true && hasUserDetails: false → Navigate to user-details.html
   * - If userExists: false → Navigate to user-details.html (new user)
   */
  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtpUnified(body.email, body.otp);
  }

  // ==================== USER DASHBOARD ====================

  /**
   * Get user dashboard data and profile information
   * POST /auth/dashboard
   * @body email: string (required)
   * @returns { success: boolean, user: { id, email, firstName, lastName, phoneNumber, dateOfBirth, createdAt } }
   */
  @Post('dashboard')
  async getUserDashboard(@Body() body: { email: string }) {
    return this.authService.getUserDashboard(body.email);
  }

  /**
   * Update user details (name, phone, date of birth)
   * POST /auth/update-details
   * @body email: string (required), firstName: string (required), lastName: string (required),
   *       phoneNumber: string (required), dateOfBirth: string (required, DD-MM-YYYY format)
   * @returns { success: boolean, message: string, user?: { email, firstName, lastName, phoneNumber, dateOfBirth } }
   */
  @Post('update-details')
  async updateUserDetails(
    @Body()
    body: {
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      dateOfBirth: string;
    },
  ) {
    return this.authService.updateUserDetails(
      body.email,
      body.firstName,
      body.lastName,
      body.phoneNumber,
      body.dateOfBirth,
    );
  }
}
