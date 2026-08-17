import { Controller, Get, Put, Post, Body, Query } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  async getSettings() {
    const settings = await this.siteSettingsService.getSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Put()
  async updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    const updated = await this.siteSettingsService.updateSettings(dto);
    return {
      success: true,
      message: 'Site settings updated successfully',
      data: updated,
    };
  }

  @Post('reset-defaults')
  async resetDefaults() {
    const reset = await this.siteSettingsService.resetDefaults();
    return {
      success: true,
      message: 'Site settings reset to default values',
      data: reset,
    };
  }

  @Post('check-email')
  async checkDisposableEmail(@Body('email') email: string, @Query('email') emailQuery?: string) {
    const targetEmail = email || emailQuery || '';
    const result = await this.siteSettingsService.checkDisposableEmail(targetEmail);
    return {
      success: true,
      data: result,
    };
  }
}
