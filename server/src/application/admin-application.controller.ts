import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminApplicationService } from './admin-application.service';
import { StaffGuard } from '../auth/staff.guard';

@Controller('admin/applications')
@UseGuards(StaffGuard)
export class AdminApplicationController {
    constructor(private adminApplicationService: AdminApplicationService) {}

    /**
     * POST /admin/applications/:id/remarks
     * Add remark/suggestion to application
     */
    @Post(':id/remarks')
    async addRemark(
        @Param('id') appId: string,
        @Body()
        body: {
            type: 'suggestion' | 'remark' | 'warning' | 'approval_note';
            content: string;
        },
        @Request() req,
    ) {
        return await this.adminApplicationService.addRemark(appId, {
            applicationId: appId,
            type: body.type,
            content: body.content,
            authorId: req.user.id,
            authorName: req.user.firstName,
            isInternal: true,
        });
    }

    /**
     * GET /admin/applications/:id/remarks
     * Get all remarks for an application
     */
    @Get(':id/remarks')
    async getRemarks(@Param('id') appId: string) {
        const remarks = await this.adminApplicationService.getApplicationRemarks(appId);
        return { success: true, data: remarks };
    }

    /**
     * PUT /admin/applications/:id/assign-mentor
     * Assign mentor and counselor to application
     */
    @Put(':id/assign-mentor')
    async assignMentorCounselor(
        @Param('id') appId: string,
        @Body()
        body: {
            mentorId: string;
            mentorName: string;
            counselorId: string;
            counselorName: string;
        },
        @Request() req,
    ) {
        return await this.adminApplicationService.assignMentorCounselor({
            applicationId: appId,
            mentorId: body.mentorId,
            mentorName: body.mentorName,
            counselorId: body.counselorId,
            counselorName: body.counselorName,
        });
    }

    /**
     * PUT /admin/applications/:id/risk-assessment
     * Assess risk level for an application
     */
    @Put(':id/risk-assessment')
    async assessRisk(
        @Param('id') appId: string,
        @Body()
        body: {
            riskLevel: 'low' | 'medium' | 'high';
            creditScore?: number;
            notes?: string;
        },
    ) {
        return await this.adminApplicationService.assessRisk({
            applicationId: appId,
            riskLevel: body.riskLevel,
            creditScore: body.creditScore,
            notes: body.notes,
        });
    }

    /**
     * POST /admin/applications/batch-process
     * Batch process multiple applications
     */
    @Post('batch-process')
    async batchProcessApplications(
        @Body()
        body: {
            applicationIds: string[];
            action: 'approve' | 'reject' | 'flag' | 'send_request';
            remarks: string;
        },
        @Request() req,
    ) {
        return await this.adminApplicationService.batchProcessApplications(
            body.applicationIds,
            body.action,
            body.remarks,
            req.user.id,
            req.user.firstName,
        );
    }

    /**
     * GET /admin/applications/:id/eligibility
     * Check application eligibility
     */
    @Get(':id/eligibility')
    async checkEligibility(@Param('id') appId: string) {
        const assessment = await this.adminApplicationService.checkEligibility(appId);
        return { success: true, data: assessment };
    }

    /**
     * GET /admin/applications/portfolio/analysis
     * Get portfolio analysis
     */
    @Get('portfolio/analysis')
    async getPortfolioAnalysis() {
        const analysis = await this.adminApplicationService.getPortfolioAnalysis();
        return { success: true, data: analysis };
    }

    /**
     * GET /admin/applications/compliance/report
     * Get compliance report
     */
    @Get('compliance/report')
    async getComplianceReport() {
        const report = await this.adminApplicationService.getComplianceReport();
        return { success: true, data: report };
    }
}
