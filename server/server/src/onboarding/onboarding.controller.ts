import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UserGuard } from '../auth/user.guard';

@Controller('onboarding')
export class OnboardingController {
    constructor(private onboardingService: OnboardingService) { }

    /**
     * Save onboarding data
     * POST /onboarding
     * @body firstName, lastName, email, phone, studyDestination, courseLevel, etc.
     * @returns { success: boolean, message: string }
     */
    @Post()
    async saveOnboardingData(@Body() body: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        studyDestination: string;
        courseLevel: string;
        courseName: string;
        university?: string;
        intakeYear?: string;
        intakeSeason?: string;
        estimatedCost: string;
        currentEducation: string;
        workExperience: string;
    }, @Request() req?) {
        return this.onboardingService.saveOnboardingData(body, req?.user?.id);
    }
}
