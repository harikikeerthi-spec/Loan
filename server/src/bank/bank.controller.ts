import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  Header,
  Res,
  HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';
import { StaffGuard } from '../auth/staff.guard';
import { BankRbacInterceptor } from './bank-rbac.middleware';
import { BankService } from './bank.service';

@Controller('api/bank')
@UseGuards(StaffGuard)
@UseInterceptors(BankRbacInterceptor)
export class BankController {
  constructor(private readonly bankService: BankService) {}

  /**
   * Helper to resolve active bank name from selectedBank header/session or email domain
   */
  private resolveBankName(req: any): string {
    const headerBank = req.headers['x-selected-bank'];
    if (headerBank) return headerBank.toString();
    
    // Fallback: extract from user profile (firstName carries bank mapping)
    if (req.user?.role === 'bank') {
      return req.user.firstName || 'SBI';
    }
    return '';
  }

  // ==================== CATEGORY A: CORE OPERATIONS ====================

  @Get('incoming-files')
  async getIncomingFiles(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const bankName = this.resolveBankName(req);
    return this.bankService.getIncomingFiles(bankName, { limit, offset });
  }

  @Post('files/:id/log')
  async logFile(
    @Request() req,
    @Param('id') id: string,
    @Body('lanNumber') lanNumber: string
  ) {
    return this.bankService.logFile(id, lanNumber, req.user);
  }

  @Get('documents/:applicationId')
  async getDocuments(@Param('applicationId') applicationId: string) {
    return this.bankService.getDocuments(applicationId);
  }

  @Get('documents/:applicationId/zip')
  @Header('Content-Type', 'application/zip')
  async downloadDocumentsZip(
    @Param('applicationId') applicationId: string,
    @Res() res: Response
  ) {
    const zipData = await this.bankService.generateDocumentsZip(applicationId);
    res.setHeader('Content-Disposition', `attachment; filename=${zipData.fileName}`);
    res.status(HttpStatus.OK).send(zipData.buffer);
  }

  @Post('decisions')
  async submitDecision(
    @Request() req,
    @Body('applicationId') applicationId: string,
    @Body('decisionType') decisionType: string,
    @Body('details') details: any
  ) {
    return this.bankService.registerDecision(applicationId, decisionType, details, req.user);
  }

  @Post('queries')
  async raiseQuery(
    @Request() req,
    @Body('applicationId') applicationId: string,
    @Body('content') content: string
  ) {
    return this.bankService.raiseQuery(applicationId, content, req.user);
  }

  @Post('disbursements/confirm')
  async confirmDisbursement(
    @Request() req,
    @Body('applicationId') applicationId: string,
    @Body('disbursementAmount') disbursementAmount: number,
    @Body('trancheNumber') trancheNumber: number,
    @Body('transferMode') transferMode: string,
    @Body('utrNumber') utrNumber: string
  ) {
    return this.bankService.confirmDisbursement(
      applicationId,
      disbursementAmount,
      trancheNumber,
      transferMode,
      utrNumber,
      req.user
    );
  }

  // ==================== CATEGORY B: DECISION VARIATIONS ====================

  @Post('conditional-sanctions')
  async conditionalSanction(
    @Request() req,
    @Body('applicationId') applicationId: string,
    @Body('conditions') conditions: string[],
    @Body('deadline') deadline: string
  ) {
    return this.bankService.registerDecision(
      applicationId,
      'conditional_sanction',
      { conditions, deadline },
      req.user
    );
  }

  @Post('partial-sanctions')
  async partialSanction(
    @Request() req,
    @Body('applicationId') applicationId: string,
    @Body('sanctionAmount') sanctionAmount: number,
    @Body('shortfallAmount') shortfallAmount: number,
    @Body('reason') reason: string
  ) {
    return this.bankService.registerDecision(
      applicationId,
      'sanction_approved', // Treated under sanction process flow
      { sanctionAmount, shortfallAmount, reason },
      req.user
    );
  }

  @Post('counter-offers')
  async counterOffer(
    @Request() req,
    @Body('applicationId') applicationId: string,
    @Body('offeredAmount') offeredAmount: number,
    @Body('offeredRate') offeredRate: number,
    @Body('offeredTenure') offeredTenure: number
  ) {
    return this.bankService.registerDecision(
      applicationId,
      'counter_offer',
      { offeredAmount, offeredRate, offeredTenure },
      req.user
    );
  }

  // ==================== CATEGORY C: ANALYTICS ====================

  @Post('file-quality-score')
  async fileQualityScore(
    @Body('applicationId') applicationId: string,
    @Body('rating') rating: number,
    @Body('feedback') feedback: string
  ) {
    return this.bankService.submitFileQualityScore(applicationId, rating, feedback);
  }

  @Get('analytics/channel')
  async getChannelAnalytics(@Request() req) {
    const bankName = this.resolveBankName(req);
    return {
      success: true,
      bank: bankName,
      roiSpreads: [
        { product: 'Scholar Loan', rate: 9.25, type: 'Floating' },
        { product: 'Student Prime', rate: 10.50, type: 'Fixed' }
      ],
      rejectionsByCause: [
        { cause: 'CIBIL Score Shortfall', count: 18 },
        { cause: 'Collateral Value Insufficient', count: 9 }
      ]
    };
  }

  @Get('analytics/rejections')
  async getRejectionAnalytics(@Request() req) {
    const bankName = this.resolveBankName(req);
    return {
      success: true,
      bank: bankName,
      totalRejections: 27,
      causes: [
        { label: 'Credit Score', count: 12 },
        { label: 'Program Ineligible', count: 15 }
      ]
    };
  }

  @Get('sla-tracker')
  async getSlaTracker(@Request() req) {
    const bankName = this.resolveBankName(req);
    return this.bankService.getSlaTrackingMetrics(bankName);
  }

  // ==================== CATEGORY D: CONFIGURATIONS ====================

  @Get('config/loan-products')
  async getLoanProducts(@Request() req) {
    const bankName = this.resolveBankName(req);
    return {
      success: true,
      products: [
        { id: '1', bank: bankName, name: 'Global Scholar Loan', roi: '9.25% - 11.50%' },
        { id: '2', bank: bankName, name: 'Domestic Executive Loan', roi: '10.50% - 13.00%' }
      ]
    };
  }

  @Post('config/loan-products')
  async createLoanProduct(@Body() body: any) {
    return { success: true, message: 'Product configuration added successfully', data: body };
  }

  @Get('config/branches')
  async getBranches(@Request() req) {
    const bankName = this.resolveBankName(req);
    return {
      success: true,
      branches: [
        { id: 'b1', name: `${bankName} — Hyderabad Hub`, city: 'Hyderabad' },
        { id: 'b2', name: `${bankName} — Bangalore Hub`, city: 'Bangalore' }
      ]
    };
  }
}
