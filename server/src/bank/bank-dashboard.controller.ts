import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { StaffGuard } from '../auth/staff.guard';
import { BankRbacInterceptor } from './bank-rbac.middleware';
import { BankDashboardService } from './bank-dashboard.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('bank/dashboard')
@UseGuards(StaffGuard)
@UseInterceptors(BankRbacInterceptor)
export class BankDashboardController {
  constructor(
    private readonly dashboardService: BankDashboardService,
    private readonly supabase: SupabaseService
  ) {}

  // ==================== CONFIGURATION ====================

  @Get('products')
  async getProducts(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getBankProducts(bankId);
  }

  @Post('products')
  async addProduct(@Request() req, @Body() body: any) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.addBankProduct(bankId, body);
  }

  @Put('products/:productId')
  async updateProduct(@Param('productId') productId: string, @Body() body: any) {
    return this.dashboardService.updateBankProduct(productId, body);
  }

  @Get('branches')
  async getBranches(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getBankBranches(bankId);
  }

  @Post('branches')
  async addBranch(@Request() req, @Body() body: any) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.addBankBranch(bankId, body);
  }

  // ==================== FILE LOGGING ====================

  @Post('files/:applicationId/log')
  async logFile(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.logFileWithLAN(applicationId, body.lanNumber, req.user);
  }

  @Get('files/by-lan/:lanNumber')
  async getByLAN(@Param('lanNumber') lanNumber: string) {
    return this.dashboardService.getFilesByLAN(lanNumber);
  }

  // ==================== ROI & FEES ====================

  @Put('applications/:applicationId/roi')
  async setROI(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.setROI(applicationId, body, req.user);
  }

  @Post('applications/:applicationId/processing-fee')
  async setProcessingFee(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.setProcessingFee(applicationId, body, req.user);
  }

  @Put('applications/:applicationId/processing-fee')
  async updateProcessingFee(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.updateProcessingFeeStatus(applicationId, body.status, body.details);
  }

  // ==================== QUERIES ====================

  @Post('applications/:applicationId/query')
  async raiseQuery(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.raiseQuery(applicationId, body, req.user);
  }

  @Get('queries')
  async getQueries(@Request() req, @Query('applicationId') applicationId?: string) {
    if (applicationId) {
      const { data, error } = await this.supabase.getClient()
        .from('BankQuery')
        .select('*')
        .eq('applicationId', applicationId)
        .order('raisedAt', { ascending: false });
      return data;
    }
    return [];
  }

  @Post('queries/:queryId/response')
  async respondToQuery(
    @Request() req,
    @Param('queryId') queryId: string,
    @Body() body: any
  ) {
    return this.dashboardService.respondToQuery(queryId, body, req.user);
  }

  @Put('queries/:queryId/resolve')
  async resolveQuery(
    @Request() req,
    @Param('queryId') queryId: string
  ) {
    return this.dashboardService.resolveQuery(queryId, req.user);
  }

  // ==================== DISBURSEMENTS ====================

  @Post('applications/:applicationId/disbursement')
  async confirmDisbursement(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.confirmDisbursement(applicationId, body, req.user);
  }

  @Get('applications/:applicationId/disbursements')
  async getDisbursements(@Param('applicationId') applicationId: string) {
    return this.dashboardService.getDisbursements(applicationId);
  }

  @Get('disbursements')
  async getAllDisbursements(@Request() req) {
    const bankId = this.resolveBankId(req);
    const { data, error } = await this.supabase.getClient()
      .from('Disbursement')
      .select(`
        *,
        LoanApplication(id, firstName, lastName, amount)
      `)
      .eq('LoanApplication.bank', bankId)
      .order('disbursedAt', { ascending: false });
    return data || [];
  }

  // ==================== QUALITY RATING ====================

  @Post('applications/:applicationId/quality-rating')
  async rateQuality(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() body: any
  ) {
    return this.dashboardService.rateFileQuality(applicationId, body, req.user);
  }

  // ==================== ANALYTICS ====================

  @Get('analytics/channel')
  async getChannelAnalytics(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getChannelAnalytics(bankId);
  }

  @Get('analytics/rejections')
  async getRejectionAnalytics(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getRejectionAnalytics(bankId);
  }

  @Get('analytics/pipeline')
  async getPipelineAnalytics(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getPipelineAnalytics(bankId);
  }

  @Get('analytics/aging')
  async getAgingAnalytics(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getAgingReport(bankId);
  }

  @Get('analytics/sla')
  async getSLAAnalytics(@Request() req) {
    const bankId = this.resolveBankId(req);
    return this.dashboardService.getSLAMetrics(bankId);
  }

  // ==================== AUDIT LOGS ====================

  @Get('applications/:applicationId/audit-logs')
  async getAuditLogs(@Param('applicationId') applicationId: string) {
    return this.dashboardService.getAuditLogs(applicationId);
  }

  // ==================== HELPER ====================

  private resolveBankId(req: any): string {
    const headerBank = req.headers['x-bank-id'];
    if (headerBank) return headerBank.toString();
    
    if (req.user?.bankId) return req.user.bankId;
    if (req.user?.firstName) return req.user.firstName;
    
    throw new Error('Bank ID not found in request');
  }
}

