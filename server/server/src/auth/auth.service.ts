import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private otps = new Map<string, string>();
  private signupData = new Map<string, {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }>();

  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private jwtService: JwtService
  ) { }

  async sendOtp(
    email: string,
    isSignup: boolean = false,
    signupInfo?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
    }
  ) {
    // Validate required fields for signup
    if (isSignup) {
      if (!signupInfo?.firstName || signupInfo.firstName.trim() === '') {
        return { success: false, message: 'Please enter your first name' };
      }

      if (!signupInfo?.lastName || signupInfo.lastName.trim() === '') {
        return { success: false, message: 'Please enter your last name' };
      }

      if (!signupInfo?.phoneNumber || signupInfo.phoneNumber.trim() === '') {
        return { success: false, message: 'Please enter your phone number' };
      }

      // Validate phone number format (only numbers, +, -, spaces, and parentheses)
      const phoneRegex = /^[0-9+\s\-()]+$/;
      if (!phoneRegex.test(signupInfo.phoneNumber)) {
        return { success: false, message: 'Please enter a valid phone number' };
      }

      // Check exact length (exactly 10 digits)
      const digitsOnly = signupInfo.phoneNumber.replace(/[^0-9]/g, '');
      if (digitsOnly.length !== 10) {
        return { success: false, message: 'Phone number must be exactly 10 digits' };
      }

      if (!signupInfo?.dateOfBirth || signupInfo.dateOfBirth.trim() === '') {
        return { success: false, message: 'Please enter your date of birth' };
      }

      // Validate date of birth format (DD-MM-YYYY)
      const dobPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!dobPattern.test(signupInfo.dateOfBirth)) {
        return { success: false, message: 'Date of birth must be in DD-MM-YYYY format (e.g., 15-01-1990)' };
      }

      // Parse and validate the date
      const dobParts = signupInfo.dateOfBirth.split('-');
      const day = parseInt(dobParts[0], 10);
      const month = parseInt(dobParts[1], 10);
      const year = parseInt(dobParts[2], 10);

      const dobDate = new Date(year, month - 1, day);

      // Check if it's a valid date
      if (dobDate.getFullYear() !== year || dobDate.getMonth() !== month - 1 || dobDate.getDate() !== day) {
        return { success: false, message: 'Please enter a valid date of birth' };
      }

      // Check if date is not in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dobDate > today) {
        return { success: false, message: 'Date of birth cannot be in the future' };
      }

      // Check if person is at least 18 years old
      const age = Math.floor((today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return { success: false, message: 'You must be at least 18 years old to register' };
      }

      // Check if date is reasonable (not more than 120 years ago)
      if (age > 120) {
        return { success: false, message: 'Please enter a valid date of birth' };
      }
    }

    // Validate email format (for both signup and login)
    if (!email || email.trim() === '') {
      return { success: false, message: 'Please enter your email address' };
    }

    // Email validation: must contain lowercase letters, @, and a valid domain
    const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return { success: false, message: 'Please enter a valid email address (e.g., user@example.com)' };
    }

    // Check if email contains @ symbol
    if (!email.includes('@')) {
      return { success: false, message: 'Email must contain @ symbol' };
    }

    // Check if email has a domain extension
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
      return { success: false, message: 'Email must have a valid domain (e.g., .com, .org)' };
    }

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

    // Store signup data for registration
    if (isSignup && signupInfo) {
      this.signupData.set(email, {
        firstName: signupInfo.firstName,
        lastName: signupInfo.lastName,
        phoneNumber: signupInfo.phoneNumber,
        dateOfBirth: signupInfo.dateOfBirth,
      });
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
        firstName: signupInfo?.firstName,
        lastName: signupInfo?.lastName,
        phoneNumber: signupInfo?.phoneNumber,
        dateOfBirth: signupInfo?.dateOfBirth,
      });
      this.signupData.delete(email); // Clean up
    }

    const payload = { email: user.email, sub: user.id, firstName: user.firstName, lastName: user.lastName };
    return {
      access_token: this.jwtService.sign(payload),
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
