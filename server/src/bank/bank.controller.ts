import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@Controller('bank')
export class BankController {
  constructor(private readonly svc: BankService) {}

  // ─── Incoming Files ───────────────────────────────────────────────────────────

  @Get('incoming')
  async getIncomingFiles(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getIncomingFiles(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('incoming/:id')
  async getIncomingFileDetail(@Param('id') id: string) {
    return this.svc.getIncomingFileDetail(id);
  }

  // ─── My Files ─────────────────────────────────────────────────────────────────

  @Get('my-files')
  async getMyFiles(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getMyFiles(req.user.id, {
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('my-files/:id')
  async getMyFileDetail(@Param('id') id: string) {
    return this.svc.getMyFileDetail(id);
  }

  // ─── Application Actions ──────────────────────────────────────────────────────

  @Post('applications/:id/log-file')
  async logFile(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    body: {
      lanNumber: string;
      assignedOfficer?: string;
      branchId?: string;
      productId?: string;
      notes?: string;
    },
  ) {
    if (!body.lanNumber) throw new BadRequestException('lanNumber is required');
    return this.svc.logFile(id, req.user.id, body);
  }

  @Get('applications/by-lan/:lan')
  async getByLan(@Param('lan') lan: string) {
    return this.svc.getByLan(lan);
  }

  @Get('applications/:id/documents')
  async getApplicationDocuments(@Param('id') id: string) {
    return this.svc.getApplicationDocuments(id);
  }

  // ─── Decisions ────────────────────────────────────────────────────────────────

  @Post('applications/:id/decision')
  async createDecision(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    body: {
      decision: string;
      sanctionAmount?: number;
      interestRate?: number;
      roiType?: string;
      tenure?: number;
      conditions?: string;
      conditionDeadline?: string;
      counterOffer?: string;
      rejectionReason?: string;
      remarks?: string;
    },
  ) {
    return this.svc.createDecision(id, req.user.id, body);
  }

  @Put('applications/:id/decision')
  async amendDecision(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    // id here is the decisionId (frontend passes the decision's id in the URL)
    return this.svc.amendDecision(id, req.user.id, body);
  }

  // ─── Sanction Letter ──────────────────────────────────────────────────────────

  @Post('applications/:id/sanction-letter')
  async uploadSanctionLetter(
    @Param('id') id: string,
    @Body() body: { sanctionLetterUrl: string },
  ) {
    return this.svc.uploadSanctionLetter(id, body.sanctionLetterUrl);
  }

  // ─── ROI ──────────────────────────────────────────────────────────────────────

  @Put('applications/:id/roi')
  async setROI(
    @Param('id') id: string,
    @Body()
    body: {
      roiType: string;
      roiBase: number;
      roiEffective: number;
      roiSubsidy?: number;
    },
  ) {
    return this.svc.setROI(id, body);
  }

  // ─── Processing Fee ───────────────────────────────────────────────────────────

  @Post('applications/:id/processing-fee')
  async setProcessingFee(
    @Param('id') id: string,
    @Body()
    body: {
      feeAmount: number;
      gstAmount?: number;
      totalAmount: number;
      paymentMode?: string;
    },
  ) {
    return this.svc.setProcessingFee(id, body);
  }

  @Put('applications/:id/processing-fee')
  async updateProcessingFee(
    @Param('id') id: string,
    @Body()
    body: {
      status: string;
      paymentRef?: string;
      paidAt?: string;
      waivedBy?: string;
      waiverReason?: string;
    },
  ) {
    return this.svc.updateProcessingFee(id, body);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────────

  @Post('applications/:id/query')
  async raiseQuery(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    body: {
      queryType: string;
      description: string;
      requiredDocs?: string;
    },
  ) {
    return this.svc.raiseQuery(id, req.user.id, body);
  }

  @Get('queries')
  async getQueries(@Req() req: any, @Query('status') status?: string) {
    return this.svc.getQueries(req.user.id, status);
  }

  @Get('queries/:id')
  async getQueryThread(@Param('id') id: string) {
    return this.svc.getQueryThread(id);
  }

  @Put('queries/:id/resolve')
  async resolveQuery(@Param('id') id: string) {
    return this.svc.resolveQuery(id);
  }

  // ─── Disbursement ─────────────────────────────────────────────────────────────

  @Post('applications/:id/disbursement')
  async confirmDisbursement(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    body: {
      trancheNumber: number;
      amount: number;
      mode: string;
      utrNumber?: string;
      beneficiary: string;
      disbursedAt: string;
      nextTrancheDue?: string;
      remainingSanction?: number;
    },
  ) {
    return this.svc.confirmDisbursement(id, req.user.id, body);
  }

  @Get('disbursements')
  async getDisbursements(@Req() req: any) {
    return this.svc.getDisbursements(req.user.id);
  }

  // ─── Quality Rating ───────────────────────────────────────────────────────────

  @Post('applications/:id/quality-rating')
  async rateFileQuality(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    body: {
      completeness: number;
      accuracy: number;
      clarity: number;
      overall: number;
      comments?: string;
    },
  ) {
    return this.svc.rateFileQuality(id, req.user.id, body);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  @Get('analytics/channel')
  async getChannelAnalytics(@Req() req: any) {
    return this.svc.getChannelAnalytics(req.user.id);
  }

  @Get('analytics/rejections')
  async getRejectionAnalytics(@Req() req: any) {
    return this.svc.getRejectionAnalytics(req.user.id);
  }

  @Get('analytics/pipeline')
  async getPipelineAnalytics(@Req() req: any) {
    return this.svc.getPipelineAnalytics(req.user.id);
  }

  @Get('analytics/aging')
  async getAgingReport(@Req() req: any) {
    return this.svc.getAgingReport(req.user.id);
  }

  @Get('analytics/sla')
  async getSLAAnalytics(@Req() req: any) {
    return this.svc.getSLAAnalytics(req.user.id);
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  @Get('products')
  async getProducts(@Req() req: any) {
    return this.svc.getProducts(req.user.id);
  }

  @Post('products')
  async createProduct(@Req() req: any, @Body() body: any) {
    return this.svc.createProduct(req.user.id, body);
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateProduct(id, body);
  }

  // ─── Branches ─────────────────────────────────────────────────────────────────

  @Get('branches')
  async getBranches(@Req() req: any) {
    return this.svc.getBranches(req.user.id);
  }

  @Post('branches')
  async createBranch(@Req() req: any, @Body() body: any) {
    return this.svc.createBranch(req.user.id, body);
  }

  // ─── Officers ─────────────────────────────────────────────────────────────────

  @Get('officers')
  async getOfficers(@Req() req: any) {
    return this.svc.getOfficers(req.user.id);
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  @Get('export/applications')
  async exportApplications(
    @Req() req: any,
    @Query('format') format = 'json',
  ) {
    return this.svc.exportApplications(req.user.id, format);
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  @Get('notifications')
  async getNotifications(@Req() req: any) {
    return this.svc.getNotifications(req.user.id);
  }

  @Put('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string) {
    return this.svc.markNotificationRead(id);
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────────

  @Post('feedback')
  async submitFeedback(@Req() req: any, @Body() body: any) {
    return this.svc.submitFeedback(req.user.id, body);
  }
}
