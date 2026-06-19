import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { StaffGuard } from '../auth/staff.guard';

@Controller('campaigns')
@UseGuards(StaffGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  async createCampaign(@Body() body: any) {
    return this.campaignService.createCampaign(body);
  }

  @Get()
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
  async getTargetAudience(
    @Query('studyDestination') studyDestination?: string,
    @Query('targetUniversity') targetUniversity?: string,
  ) {
    return this.campaignService.getTargetAudience({
      studyDestination,
      targetUniversity,
    });
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id);
  }

  @Delete(':id')
  async deleteCampaign(@Param('id') id: string) {
    return this.campaignService.deleteCampaign(id);
  }

  @Post(':id/queue')
  async queueCampaign(
    @Param('id') id: string,
    @Body('recipientIds') recipientIds: string[],
  ) {
    return this.campaignService.queueCampaign(id, recipientIds);
  }

  @Post(':id/cancel')
  async cancelCampaign(@Param('id') id: string) {
    return this.campaignService.cancelCampaign(id);
  }
}
