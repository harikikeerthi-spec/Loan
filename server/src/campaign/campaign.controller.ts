import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { StaffGuard } from '../auth/staff.guard';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) { }

  @Post()
  @UseGuards(StaffGuard)
  async createCampaign(@Body() body: any) {
    return this.campaignService.createCampaign(body);
  }

  @Post('generate')
  @UseGuards(StaffGuard)
  async generateCampaignEmail(@Body() body: any) {
    return this.campaignService.generateCampaignEmail(body);
  }

  @Get()
  @UseGuards(StaffGuard)
  async getCampaigns(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    return this.campaignService.getCampaigns(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
      status,
    );
  }

  // --- Audience Builder Filters ---
  @Get('audience')
  @UseGuards(StaffGuard)
  async getTargetAudience(@Query() filters: any) {
    return this.campaignService.getTargetAudience(filters);
  }

  @Post('audience/save')
  @UseGuards(StaffGuard)
  async saveAudience(@Body() body: any) {
    return this.campaignService.saveAudience(body);
  }

  @Get('audience/saved')
  @UseGuards(StaffGuard)
  async getSavedAudiences() {
    return this.campaignService.getSavedAudiences();
  }

  // --- Campaign Templates ---
  @Get('templates')
  @UseGuards(StaffGuard)
  async getTemplates() {
    return this.campaignService.getTemplates();
  }

  @Post('templates')
  @UseGuards(StaffGuard)
  async createTemplate(@Body() body: any) {
    return this.campaignService.createTemplate(body);
  }

  // --- Automation Rules ---
  @Get('automation')
  @UseGuards(StaffGuard)
  async getAutomationRules() {
    return this.campaignService.getAutomationRules();
  }

  @Post('automation')
  @UseGuards(StaffGuard)
  async createAutomationRule(@Body() body: any) {
    return this.campaignService.createAutomationRule(body);
  }

  // --- Prompt & Logs ---
  @Get('prompt-history')
  @UseGuards(StaffGuard)
  async getPromptHistory() {
    return this.campaignService.getPromptHistory();
  }

  // --- Analytics Overview ---
  @Get('analytics/overview')
  @UseGuards(StaffGuard)
  async getOverviewStats() {
    return this.campaignService.getOverviewStats();
  }

  // --- Pre-send Validation & AI scoring ---
  @Post(':id/validate')
  @UseGuards(StaffGuard)
  async validateCampaign(@Param('id') id: string) {
    return this.campaignService.validateCampaign(id);
  }

  @Post(':id/test-email')
  @UseGuards(StaffGuard)
  async sendTestEmail(@Param('id') id: string, @Body('email') email: string) {
    return this.campaignService.sendTestEmail(id, email);
  }

  // --- Public Tracking Endpoints ---
  @Get('track/open/:recipientId')
  async trackOpen(@Param('recipientId') recipientId: string, @Res() res: any) {
    await this.campaignService.trackOpen(recipientId);
    
    // Return a 1x1 transparent tracking GIF
    const buffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    });
    res.end(buffer);
  }

  @Get('track/click/:recipientId')
  async trackClick(
    @Param('recipientId') recipientId: string,
    @Query('redirect') redirect: string,
    @Res() res: any,
  ) {
    await this.campaignService.trackClick(recipientId);
    
    // Redirect to target URL or fallback
    const targetUrl = redirect || 'https://vidyaloan.com/dashboard';
    res.redirect(302, targetUrl);
  }
  // ---------------------------------

  @Get(':id')
  @UseGuards(StaffGuard)
  async getCampaignById(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id);
  }

  @Patch(':id')
  @UseGuards(StaffGuard)
  async updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.campaignService.updateCampaign(id, body);
  }

  @Delete(':id')
  @UseGuards(StaffGuard)
  async deleteCampaign(@Param('id') id: string) {
    return this.campaignService.deleteCampaign(id);
  }

  @Post(':id/queue')
  @UseGuards(StaffGuard)
  async queueCampaign(
    @Param('id') id: string,
    @Body('recipientIds') recipientIds: string[],
  ) {
    return this.campaignService.queueCampaign(id, recipientIds);
  }

  @Post(':id/cancel')
  @UseGuards(StaffGuard)
  async cancelCampaign(@Param('id') id: string) {
    return this.campaignService.cancelCampaign(id);
  }
}
