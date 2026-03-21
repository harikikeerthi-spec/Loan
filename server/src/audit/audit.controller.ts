
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get('activity')
    @UseGuards(AdminGuard)
    async getRecentActivity(@Query('limit') limit: string) {
        const limitNum = parseInt(limit, 10) || 20;
        return {
            success: true,
            data: await this.auditService.getRecentActivity(limitNum),
        };
    }
}
