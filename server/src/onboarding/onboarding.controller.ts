import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UserGuard } from '../auth/user.guard';

@Controller('onboarding')
@UseGuards(UserGuard)
export class OnboardingController {
    constructor(private onboardingService: OnboardingService) { }

    /**
     * Save onboarding data
     * POST /onboarding
     * @body onboarding data
     * @returns { success: boolean, message: string }
     */
    @Post()
    async saveOnboardingData(@Body() body: any, @Request() req) {
        // If staff/admin is submitting on behalf of a user, use the provided email or id
        const isAdminOrStaff = req.user && ['admin', 'super_admin', 'staff'].includes(req.user.role);
        
        let targetUserId = req.user.id;
        
        // If admin provides an email or explicitly asks to update another user, skip passing their own ID
        // so the service will look up by the provided email instead.
        if (isAdminOrStaff && body.userId) {
            targetUserId = body.userId;
        } else if (isAdminOrStaff && body.email) {
            targetUserId = undefined; 
        }

        return this.onboardingService.saveOnboardingData(body, targetUserId);
    }

    /**
     * Get onboarding status
     * GET /onboarding/status
     * @returns { success: boolean, user: User }
     */
    @Get('status')
    async getStatus(@Request() req) {
        const user = req.user;
        const keysToCheck = [
            'goal', 'studyDestination', 'courseName', 'bachelorsDegree', 'gpa', 'workExp'
        ];
        const isCompleted = keysToCheck.every(k => !!user[k]);

        return {
            success: true,
            isCompleted,
            user
        };
    }
}
