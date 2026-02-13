import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingService {
    constructor(private prisma: PrismaService) { }

    async saveOnboardingData(data: any, userId?: string) {
        try {
            // Find or create user by email
            let user = await this.prisma.user.findUnique({
                where: { email: data.email }
            });

            if (!user) {
                // Create new user with onboarding data
                user = await this.prisma.user.create({
                    data: {
                        email: data.email,
                        firstName: data.firstName || 'User',
                        lastName: '', // Not collected in simplified flow
                        phoneNumber: data.phone || '',
                        mobile: data.phone || '',
                        password: '', // No password for onboarding users
                        role: 'user'
                    }
                });
            } else {
                // Update existing user with onboarding data
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        firstName: data.firstName || user.firstName,
                        phoneNumber: data.phone || user.phoneNumber
                    }
                });
            }

            // Store onboarding preferences (study plans)
            // This data can be stored in a separate table or returned to frontend
            const preferences = {
                goal: data.goal,
                studyDestination: data.studyDestination,
                courseLevel: data.courseLevel,
                courseName: data.courseName,
                intakeSeason: data.intakeSeason
            };

            return {
                success: true,
                message: 'Onboarding data saved successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    preferences: preferences
                }
            };
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            return {
                success: false,
                message: 'Failed to save onboarding data',
                error: error.message
            };
        }
    }
}
