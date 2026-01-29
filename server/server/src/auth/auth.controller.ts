import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) { }

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
   * Get complete dashboard data including applications and documents
   * POST /auth/dashboard-data
   * @body userId: string (required)
   * @returns { success: boolean, data: { applications: [], documents: [] } }
   */
  @Post('dashboard-data')
  async getDashboardData(@Body() body: { userId: string }) {
    try {
      const data = await this.usersService.getUserDashboardData(body.userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch dashboard data',
      };
    }
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

  // ==================== LOAN APPLICATIONS ====================

  /**
   * Create a new loan application
   * POST /auth/create-application
   * @body userId: string, bank: string, loanType: string, amount: number, purpose?: string
   * @returns { success: boolean, application?: LoanApplication }
   */
  @Post('create-application')
  async createApplication(@Body() body: {
    userId: string;
    bank: string;
    loanType: string;
    amount: number;
    purpose?: string;
  }) {
    try {
      const application = await this.usersService.createLoanApplication(body.userId, {
        bank: body.bank,
        loanType: body.loanType,
        amount: body.amount,
        purpose: body.purpose,
      });
      return {
        success: true,
        application,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create application',
      };
    }
  }

  /**
   * Get user's loan applications
   * POST /auth/applications
   * @body userId: string (required)
   * @returns { success: boolean, applications: [] }
   */
  @Post('applications')
  async getApplications(@Body() body: { userId: string }) {
    try {
      const applications = await this.usersService.getUserApplications(body.userId);
      return {
        success: true,
        applications,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch applications',
      };
    }
  }

  /**
   * Update loan application status
   * POST /auth/update-application/:id
   * @body status: string (required) - pending, processing, approved, rejected
   * @returns { success: boolean, application?: LoanApplication }
   */
  @Post('update-application/:id')
  async updateApplication(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    try {
      const application = await this.usersService.updateLoanApplicationStatus(id, body.status);
      return {
        success: true,
        application,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update application',
      };
    }
  }

  /**
   * Delete a loan application
   * DELETE /auth/application/:id
   * @returns { success: boolean, message: string }
   */
  @Delete('application/:id')
  async deleteApplication(@Param('id') id: string) {
    try {
      await this.usersService.deleteLoanApplication(id);
      return {
        success: true,
        message: 'Application deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete application',
      };
    }
  }

  // ==================== DOCUMENTS ====================

  /**
   * Upload or update document status
   * POST /auth/upload-document
   * @body userId: string, docType: string, uploaded: boolean, filePath?: string
   * @returns { success: boolean, document?: UserDocument }
   */
  @Post('upload-document')
  async uploadDocument(@Body() body: {
    userId: string;
    docType: string;
    uploaded: boolean;
    filePath?: string;
  }) {
    try {
      const document = await this.usersService.upsertUserDocument(body.userId, body.docType, {
        uploaded: body.uploaded,
        filePath: body.filePath,
        status: body.uploaded ? 'uploaded' : 'pending',
      });
      return {
        success: true,
        document,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload document',
      };
    }
  }

  /**
   * Get user's documents
   * POST /auth/documents
   * @body userId: string (required)
   * @returns { success: boolean, documents: [] }
   */
  @Post('documents')
  async getDocuments(@Body() body: { userId: string }) {
    try {
      const documents = await this.usersService.getUserDocuments(body.userId);
      return {
        success: true,
        documents,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch documents',
      };
    }
  }

  /**
   * Delete a document
   * DELETE /auth/document/:userId/:docType
   * @returns { success: boolean, message: string }
   */
  @Delete('document/:userId/:docType')
  async deleteDocument(
    @Param('userId') userId: string,
    @Param('docType') docType: string
  ) {
    try {
      await this.usersService.deleteUserDocument(userId, docType);
      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete document',
      };
    }
  }
}


