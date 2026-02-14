import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private otps = new Map<string, string>();
  private signupData = new Map<
    string,
    {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
    }
  >();

  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) { }

  async sendOtp(
    email: string,
    isSignup: boolean = false,
    signupInfo?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
    },
  ) {
    // Validate required fields for signup (only if provided)
    if (isSignup && signupInfo) {
      // Validate firstName if provided
      if (signupInfo.firstName !== undefined) {
        if (signupInfo.firstName.trim() === '') {
          return { success: false, message: 'Please enter your first name' };
        }

        if (signupInfo.firstName.length > 30) {
          return {
            success: false,
            message: 'First name must not exceed 30 characters',
          };
        }
      }

      // Validate lastName if provided
      if (signupInfo.lastName !== undefined) {
        if (signupInfo.lastName.trim() === '') {
          return { success: false, message: 'Please enter your last name' };
        }

        if (signupInfo.lastName.length > 30) {
          return {
            success: false,
            message: 'Last name must not exceed 30 characters',
          };
        }
      }

      // Validate phoneNumber if provided
      if (signupInfo.phoneNumber !== undefined) {
        if (signupInfo.phoneNumber.trim() === '') {
          return { success: false, message: 'Please enter your phone number' };
        }

        // Validate phone number format (only numbers, +, -, spaces, and parentheses)
        const phoneRegex = /^[0-9+\s\-()]+$/;
        if (!phoneRegex.test(signupInfo.phoneNumber)) {
          return {
            success: false,
            message: 'Please enter a valid phone number',
          };
        }

        // Check exact length (exactly 10 digits)
        const digitsOnly = signupInfo.phoneNumber.replace(/[^0-9]/g, '');
        if (digitsOnly.length !== 10) {
          return {
            success: false,
            message: 'Phone number must be exactly 10 digits',
          };
        }
      }

      // Validate dateOfBirth if provided
      if (signupInfo.dateOfBirth !== undefined) {
        if (signupInfo.dateOfBirth.trim() === '') {
          return { success: false, message: 'Please enter your date of birth' };
        }

        // Validate date of birth format (DD-MM-YYYY)
        const dobPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
        if (!dobPattern.test(signupInfo.dateOfBirth)) {
          return {
            success: false,
            message:
              'Date of birth must be in DD-MM-YYYY format (e.g., 15-01-1990)',
          };
        }

        // Parse and validate the date
        const dobParts = signupInfo.dateOfBirth.split('-');
        const day = parseInt(dobParts[0], 10);
        const month = parseInt(dobParts[1], 10);
        const year = parseInt(dobParts[2], 10);

        const dobDate = new Date(year, month - 1, day);

        // Check if it's a valid date
        if (
          dobDate.getFullYear() !== year ||
          dobDate.getMonth() !== month - 1 ||
          dobDate.getDate() !== day
        ) {
          return {
            success: false,
            message: 'Please enter a valid date of birth',
          };
        }

        // Check if date is not in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dobDate > today) {
          return {
            success: false,
            message: 'Date of birth cannot be in the future',
          };
        }

        // Check if person is at least 18 years old
        const age = Math.floor(
          (today.getTime() - dobDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
        );
        if (age < 18) {
          return {
            success: false,
            message: 'You must be at least 18 years old to register',
          };
        }

        // Check if date is reasonable (not more than 120 years ago)
        if (age > 120) {
          return {
            success: false,
            message: 'Please enter a valid date of birth',
          };
        }
      }
    }

    // Validate email format (for both signup and login)
    if (!email || email.trim() === '') {
      return { success: false, message: 'Please enter your email address' };
    }

    // Check for @ symbol first
    if (!email.includes('@')) {
      return { success: false, message: 'Email must contain @ symbol' };
    }

    // Split email into username and domain
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
      return {
        success: false,
        message: 'Email must have a valid domain (e.g., .com, .org)',
      };
    }

    const username = emailParts[0];
    const domain = emailParts[1];

    // Validate username: minimum 8 characters
    if (username.length < 8) {
      return {
        success: false,
        message: 'Email username (before @) must be at least 8 characters long',
      };
    }

    // Validate username: must include at least one alphabetical character (a-z)
    if (!/[a-z]/.test(username)) {
      return {
        success: false,
        message:
          'Email username must include at least one alphabetical character (a-z)',
      };
    }

    // Validate username: no capital letters allowed
    if (/[A-Z]/.test(username)) {
      return {
        success: false,
        message: 'Email username must not contain capital letters',
      };
    }

    // Email validation: must contain lowercase letters, @, and a valid domain
    const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return {
        success: false,
        message:
          'Please enter a valid email address (e.g., username@example.com)',
      };
    }

    // Check if user exists
    const existingUser = await this.usersService.findOne(email);

    if (isSignup && existingUser) {
      // User trying to signup but already exists
      return {
        success: false,
        message: 'User already exists. Please login instead.',
        redirect: 'login',
      };
    }

    if (!isSignup && !existingUser) {
      // User trying to login but doesn't exist
      return {
        success: false,
        message: 'User not found. Please signup first.',
        redirect: 'signup',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otps.set(email, otp);
    console.log(`[AuthService] New OTP generated for ${email}: ${otp}`);

    // Store signup data for registration - ONLY update if fields are provided
    // This prevents overwriting existing data with 'undefined' during resend
    if (isSignup && signupInfo) {
      const existingData = this.signupData.get(email) || {};

      this.signupData.set(email, {
        firstName: signupInfo.firstName ?? existingData.firstName,
        lastName: signupInfo.lastName ?? existingData.lastName,
        phoneNumber: signupInfo.phoneNumber ?? existingData.phoneNumber,
        dateOfBirth: signupInfo.dateOfBirth ?? existingData.dateOfBirth,
      });
      console.log(`[AuthService] Signup data updated/preserved for ${email}`);
    }

    await this.emailService.sendOtp(email, otp);
    return { success: true, message: 'OTP sent successfully' };
  }

  async checkUserExists(email: string) {
    const user = await this.usersService.findOne(email);
    if (user) {
      return { exists: true, message: 'User found' };
    } else {
      return {
        exists: false,
        message: 'User not found. Please sign up first.',
      };
    }
  }

  // ==================== UNIFIED OTP FLOW ====================

  /**
   * Send OTP to email - works for both new and existing users
   * Step 1 of unified flow
   */
  async sendOtpUnified(email: string) {
    // Validate email format
    if (!email || email.trim() === '') {
      return { success: false, message: 'Please enter your email address' };
    }

    if (!email.includes('@')) {
      return { success: false, message: 'Email must contain @ symbol' };
    }

    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
      return {
        success: false,
        message: 'Email must have a valid domain (e.g., .com, .org)',
      };
    }

    const username = emailParts[0];
    const domain = emailParts[1];

    if (username.length < 8) {
      return {
        success: false,
        message: 'Email username (before @) must be at least 8 characters long',
      };
    }

    if (!/[a-z]/.test(username)) {
      return {
        success: false,
        message:
          'Email username must include at least one alphabetical character (a-z)',
      };
    }

    if (/[A-Z]/.test(username)) {
      return {
        success: false,
        message: 'Email username must not contain capital letters',
      };
    }

    const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return {
        success: false,
        message:
          'Please enter a valid email address (e.g., username@example.com)',
      };
    }

    // Check if user exists
    const existingUser = await this.usersService.findOne(email);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otps.set(email, otp);
    console.log(`[AuthService] OTP generated for ${email}: ${otp}`);

    // Send OTP via email
    await this.emailService.sendOtp(email, otp);

    return {
      success: true,
      message: 'OTP sent successfully',
      userExists: !!existingUser, // Return whether user exists or not
    };
  }

  /**
   * Verify OTP and handle both new and existing users
   * Step 2 of unified flow
   *
   * For existing users with complete details: return token + userExists=true, hasUserDetails=true
   * For existing users without details: return token + userExists=true, hasUserDetails=false
   * For new users: create user + return token + userExists=false, hasUserDetails=false
   */
  async verifyOtpUnified(email: string, otp: string) {
    // Verify OTP
    const storedOtp = this.otps.get(email);
    if (!storedOtp || storedOtp !== otp) {
      return {
        success: false,
        message: 'Invalid or expired OTP. Please try again.',
      };
    }

    // Invalidate OTP after verification
    this.otps.delete(email);

    try {
      // Find or create user
      let user = await this.usersService.findOne(email);
      const isNewUser = !user;

      if (!user) {
        // Create new user with only email; optional fields omitted
        user = await this.usersService.create({ email });
        console.log(`[AuthService] New user created: ${email}`);
      }

      // Check if user has complete details
      const hasUserDetails = !!(
        user.firstName &&
        user.lastName &&
        user.phoneNumber &&
        user.dateOfBirth
      );

      // Generate JWT token
      const payload = {
        email: user.email,
        sub: user.id,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const accessToken = this.jwtService.sign(payload);

      return {
        success: true,
        message: isNewUser
          ? 'Signup successful. Please complete your profile.'
          : 'Login successful.',
        access_token: accessToken,
        userExists: !isNewUser,
        hasUserDetails,
        firstName: user.firstName,
        lastName: user.lastName,
        userId: user.id,
      };
    } catch (error) {
      console.error('[AuthService] Error in verifyOtpUnified:', error);
      return {
        success: false,
        message: 'An error occurred during verification. Please try again.',
      };
    }
  }

  async getUserDashboard(email: string) {
    const user = await this.usersService.findOne(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Format date of birth if it exists
    let formattedDob: string | null = null;
    if (user.dateOfBirth) {
      const date = new Date(user.dateOfBirth);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      formattedDob = `${day}-${month}-${year}`;
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        dateOfBirth: formattedDob,
        createdAt: user.createdAt,
      },
    };
  }

  async updateUserDetails(
    email: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    dateOfBirth: string,
  ) {
    // First, check if user exists with the provided email
    const existingUser = await this.usersService.findOne(email);
    if (!existingUser) {
      return {
        success: false,
        message:
          'User does not exist. Please check your email address or sign up first.',
      };
    }

    // Validate firstName
    if (!firstName || firstName.trim() === '') {
      return { success: false, message: 'Please enter your first name' };
    }
    if (firstName.length > 30) {
      return {
        success: false,
        message: 'First name must not exceed 30 characters',
      };
    }

    // Validate lastName
    if (!lastName || lastName.trim() === '') {
      return { success: false, message: 'Please enter your last name' };
    }
    if (lastName.length > 30) {
      return {
        success: false,
        message: 'Last name must not exceed 30 characters',
      };
    }

    // Validate phoneNumber
    if (!phoneNumber || phoneNumber.trim() === '') {
      return { success: false, message: 'Please enter your phone number' };
    }
    const phoneRegex = /^[0-9+\s\-()]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      return { success: false, message: 'Please enter a valid phone number' };
    }
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
    if (digitsOnly.length !== 10) {
      return {
        success: false,
        message: 'Phone number must be exactly 10 digits',
      };
    }

    // Validate dateOfBirth
    if (!dateOfBirth || dateOfBirth.trim() === '') {
      return { success: false, message: 'Please enter your date of birth' };
    }
    const dobPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    if (!dobPattern.test(dateOfBirth)) {
      return {
        success: false,
        message:
          'Date of birth must be in DD-MM-YYYY format (e.g., 15-01-1990)',
      };
    }

    // Parse and validate the date
    const dobParts = dateOfBirth.split('-');
    const day = parseInt(dobParts[0], 10);
    const month = parseInt(dobParts[1], 10);
    const year = parseInt(dobParts[2], 10);
    const dobDate = new Date(year, month - 1, day);

    if (
      dobDate.getFullYear() !== year ||
      dobDate.getMonth() !== month - 1 ||
      dobDate.getDate() !== day
    ) {
      return { success: false, message: 'Please enter a valid date of birth' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dobDate > today) {
      return {
        success: false,
        message: 'Date of birth cannot be in the future',
      };
    }

    const age = Math.floor(
      (today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    if (age < 18) {
      return {
        success: false,
        message: 'You must be at least 18 years old to register',
      };
    }
    if (age > 120) {
      return { success: false, message: 'Please enter a valid date of birth' };
    }

    // Update user details
    try {
      const user = await this.usersService.updateUserDetails(
        email,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
      );

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          userId: user.id,
        },
      };
    } catch (error) {
      console.error('Error updating user details:', error);
      return {
        success: false,
        message:
          'Failed to update profile. Please try again or contact support.',
      };
    }
  }
}
