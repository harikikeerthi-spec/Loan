import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

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

  // ==================== USER REGISTRATION ====================

  /**
   * Step 1: Send OTP to email for registration
   * POST /auth/register/send-otp
   * @body email: string (required), firstName?: string, lastName?: string, phoneNumber?: string, dateOfBirth?: string
   * @returns { success: boolean, message: string, redirect?: string }
   */
  @Post('register/send-otp')
  async registerSendOtp(@Body() body: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }) {
    return this.authService.sendOtp(body.email, true, {
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      dateOfBirth: body.dateOfBirth,
    });
  }

  /**
   * Step 2: Verify OTP and complete user registration
   * POST /auth/register/verify-otp
   * @body email: string (required), otp: string (required, 6 digits)
   * @returns { access_token: string, firstName: string, lastName: string, hasUserDetails: boolean }
   */
  @Post('register/verify-otp')
  async registerVerifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  // ==================== USER LOGIN ====================

  /**
   * Step 1: Send OTP to email for login
   * POST /auth/login/send-otp
   * @body email: string (required)
   * @returns { success: boolean, message: string, redirect?: string }
   */
  @Post('login/send-otp')
  async loginSendOtp(@Body() body: { email: string }) {
    return this.authService.sendOtp(body.email, false);
  }

  /**
   * Step 2: Verify OTP and complete user login
   * POST /auth/login/verify-otp
   * @body email: string (required), otp: string (required, 6 digits)
   * @returns { access_token: string, firstName: string, lastName: string, hasUserDetails: boolean }
   */
  @Post('login/verify-otp')
  async loginVerifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
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
  async updateUserDetails(@Body() body: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
  }) {
    return this.authService.updateUserDetails(
      body.email,
      body.firstName,
      body.lastName,
      body.phoneNumber,
      body.dateOfBirth
    );
  }
}
