import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserGuard } from '../auth/user.guard';

@UseGuards(UserGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    
    const result = await this.notificationService.getNotificationsForUser(
      req.user,
      type,
      limitNum,
      offsetNum,
    );
    return { success: true, ...result };
  }

  @Put(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Param('id') id: string, @Req() req: any) {
    const data = await this.notificationService.markAsRead(id, req.user);
    return { success: true, data };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markReadAlias(@Param('id') id: string, @Req() req: any) {
    return this.markRead(id, req);
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@Req() req: any) {
    const result = await this.notificationService.markAllAsRead(req.user);
    return result;
  }
}
