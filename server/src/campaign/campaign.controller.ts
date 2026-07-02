import {
  Controller,
  Get,
  Post,
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
  ) {
    return this.campaignService.getCampaigns(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('audience')
  @UseGuards(StaffGuard)
  async getTargetAudience(
    @Query('studyDestination') studyDestination?: string,
    @Query('targetUniversity') targetUniversity?: string,
  ) {
    return this.campaignService.getTargetAudience({
      studyDestination,
      targetUniversity,
    });
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
