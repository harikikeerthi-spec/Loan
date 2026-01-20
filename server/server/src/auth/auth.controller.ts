import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('check-user/:email')
  async checkUserExists(@Param('email') email: string) {
    return this.authService.checkUserExists(email);
  }

  // ==================== USER REGISTRATION ====================
  
  // Step 1: Send OTP for registration
  @Post('register/send-otp')
  async registerSendOtp(@Body() body: { email: string; username: string }) {
    return this.authService.sendOtp(body.email, true, body.username);
  }

  // Step 2: Verify OTP to complete registration
  @Post('register/verify-otp')
  async registerVerifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  // ==================== USER LOGIN ====================
  
  // Step 1: Send OTP for login
  @Post('login/send-otp')
  async loginSendOtp(@Body() body: { email: string }) {
    return this.authService.sendOtp(body.email, false);
  }

  // Step 2: Verify OTP to complete login
  @Post('login/verify-otp')
  async loginVerifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }
}
