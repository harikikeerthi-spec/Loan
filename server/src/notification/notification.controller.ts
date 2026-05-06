import { Controller, Get, Post, Body, Query, Put, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Query('userId') userId: string) {
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }
    const notifications = await this.notificationService.getUserNotifications(userId);
    return { success: true, data: notifications };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(id);
    return { success: !!notification, data: notification };
  }

  @Post('read-all')
  async markAllAsRead(@Body('userId') userId: string) {
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }
    const success = await this.notificationService.markAllAsRead(userId);
    return { success };
  }

  @Post('create')
  async createNotification(
    @Body() body: { userId: string; title: string; body: string; type?: string },
  ) {
    const notification = await this.notificationService.create(
      body.userId,
      body.title,
      body.body,
      body.type,
    );
    return { success: !!notification, data: notification };
  }
}
