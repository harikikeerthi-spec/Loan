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
        return this.onboardingService.saveOnboardingData(body, req.user.id);
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
