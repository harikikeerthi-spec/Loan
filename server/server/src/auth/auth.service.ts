import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private otps = new Map<string, string>();
  private signupData = new Map<string, { username: string }>();

  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private jwtService: JwtService
  ) {}

  async sendOtp(email: string, isSignup: boolean = false, username?: string) {
    // Check if user exists
    const existingUser = await this.usersService.findOne(email);
    
    if (isSignup && existingUser) {
      // User trying to signup but already exists
      return { success: false, message: 'User already exists. Please login instead.', redirect: 'login' };
    }
    
    if (!isSignup && !existingUser) {
      // User trying to login but doesn't exist
      return { success: false, message: 'User not found. Please signup first.', redirect: 'signup' };
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otps.set(email, otp);
    
    // Store username for signup
    if (isSignup && username) {
      this.signupData.set(email, { username });
    }
    
    await this.emailService.sendOtp(email, otp);
    return { success: true, message: 'OTP sent successfully' };
  }

  async checkUserExists(email: string) {
    const user = await this.usersService.findOne(email);
    if (user) {
      return { exists: true, message: 'User found' };
    } else {
      return { exists: false, message: 'User not found. Please sign up first.' };
    }
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = this.otps.get(email);
    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    
    this.otps.delete(email); // Invalidate OTP after use
    
    // Find or create user
    let user = await this.usersService.findOne(email);
    if (!user) {
      // Get stored signup data
      const signupInfo = this.signupData.get(email);
      user = await this.usersService.create({ 
        email,
        username: signupInfo?.username 
      });
      this.signupData.delete(email); // Clean up
    }

    const payload = { email: user.email, sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
    };
  }
}
