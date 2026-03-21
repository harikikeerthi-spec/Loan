import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingService {
    constructor(private prisma: PrismaService) { }

    async saveOnboardingData(data: any, userId?: string) {
        try {
            // Find user by ID or email
            let user;
            if (userId) {
                user = await this.prisma.user.findUnique({ where: { id: userId } });
            } else if (data.email) {
                user = await this.prisma.user.findUnique({ where: { email: data.email } });
            }

            // Map data from frontend (could come from direct form or answers object)
            const goalValue = data.goal?.value || data.goal || data.courseLevel;
            const countryValue = data.country?.value || data.studyDestination || data.study_destination;
            const courseValue = data.course?.value || data.courseName || data.course_name;
            const targetUniValue = data.target_university?.label || data.targetUniversity || data.target_university;
            const intakeValue = data.start_when?.value || data.intakeSeason || data.intake_season;
            const bachelorsValue = data.bachelors_degree?.label || data.bachelorsDegree || data.currentEducation;
            const gpaValue = data.gpa?.value ? parseFloat(data.gpa.value) : (data.gpa ? parseFloat(data.gpa) : undefined);
            const workExpValue = data.work_exp?.value ? parseInt(data.work_exp.value) : (data.workExperience ? parseInt(data.workExperience) : undefined);
            const entranceTestValue = data.entrance_test?.value || data.entranceTest;
            const entranceScoreValue = data.entrance_score?.value || data.entranceScore;
            const englishTestValue = data.english_test?.value || data.englishTest;
            const englishScoreValue = data.english_score?.value || data.englishScore;
            const budgetValue = data.study_budget?.label || data.budget || data.estimatedCost;
            const pincodeValue = data.loan_pincode?.value || data.pincode;
            const loanAmountValue = data.loan_amount?.label || data.loanAmount;
            const admitStatusValue = data.admit_status?.value || data.admitStatus;

            const updateData: any = {
                firstName: data.firstName || user?.firstName,
                lastName: data.lastName || user?.lastName,
                phoneNumber: data.phone || data.phoneNumber || user?.phoneNumber,
                mobile: data.phone || data.phoneNumber || user?.mobile,
                // Onboarding & Preferences
                goal: goalValue,
                studyDestination: countryValue,
                courseName: courseValue,
                targetUniversity: targetUniValue,
                intakeSeason: intakeValue,
                bachelorsDegree: bachelorsValue,
                workExp: workExpValue,
                gpa: gpaValue,
                entranceTest: entranceTestValue,
                entranceScore: entranceScoreValue,
                englishTest: englishTestValue,
                englishScore: englishScoreValue,
                budget: budgetValue,
                pincode: pincodeValue,
                loanAmount: loanAmountValue,
                admitStatus: admitStatusValue,
            };

            if (!user) {
                if (!data.email) {
                    return { success: false, message: 'Email required for new user' };
                }
                // Create new user with onboarding data
                user = await this.prisma.user.create({
                    data: {
                        email: data.email,
                        firstName: updateData.firstName || 'User',
                        mobile: updateData.mobile || '',
                        password: '', // No password for initial onboarding
                        role: 'user',
                        ...updateData
                    }
                });
            } else {
                // Update existing user with onboarding data
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: updateData
                });
            }

            // --- SYNC TO ONBOARDING LEADS (for Service Team) ---
            const leadData = {
                userId: user.id,
                email: user.email,
                fullName: (updateData.firstName && updateData.lastName)
                    ? `${updateData.firstName} ${updateData.lastName}`
                    : (user.firstName + ' ' + (user.lastName || '')).trim(),
                phone: updateData.mobile,
                goal: goalValue,
                studyDestination: countryValue,
                courseName: courseValue,
                targetUniversity: targetUniValue,
                intakeSeason: intakeValue,
                bachelorsDegree: bachelorsValue,
                gpa: gpaValue,
                workExp: workExpValue,
                entranceTest: entranceTestValue,
                entranceScore: entranceScoreValue,
                englishTest: englishTestValue,
                englishScore: englishScoreValue,
                budget: budgetValue,
                pincode: pincodeValue,
                loanAmount: loanAmountValue,
                admitStatus: admitStatusValue,
                source: "onboarding_bot",
                status: user.admitStatus ? 'processing' : 'pending' // Just a basic rule
            };

            await this.prisma.onboardingApplication.upsert({
                where: { userId: user.id },
                update: leadData,
                create: leadData
            });

            // --- SYNC TO NORMALIZED SPECIALIZED TABLES (Academic, Financial, Study) ---
            await Promise.all([
                // 1. Study Preferences Table
                this.prisma.userStudyPreference.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        goal: goalValue,
                        studyDestination: countryValue,
                        courseName: courseValue,
                        targetUniversity: targetUniValue,
                        intakeSeason: intakeValue,
                        admitStatus: admitStatusValue,
                    },
                    update: {
                        goal: goalValue,
                        studyDestination: countryValue,
                        courseName: courseValue,
                        targetUniversity: targetUniValue,
                        intakeSeason: intakeValue,
                        admitStatus: admitStatusValue,
                    }
                }),

                // 2. Academic Profile Table
                this.prisma.userAcademicProfile.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        bachelorsDegree: bachelorsValue,
                        gpa: gpaValue,
                        workExp: workExpValue,
                        entranceTest: entranceTestValue,
                        entranceScore: entranceScoreValue,
                        englishTest: englishTestValue,
                        englishScore: englishScoreValue,
                    },
                    update: {
                        bachelorsDegree: bachelorsValue,
                        gpa: gpaValue,
                        workExp: workExpValue,
                        entranceTest: entranceTestValue,
                        entranceScore: entranceScoreValue,
                        englishTest: englishTestValue,
                        englishScore: englishScoreValue,
                    }
                }),

                // 3. Financial Profile Table
                this.prisma.userFinancialProfile.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        budget: budgetValue,
                        pincode: pincodeValue,
                        loanAmount: loanAmountValue,
                    },
                    update: {
                        budget: budgetValue,
                        pincode: pincodeValue,
                        loanAmount: loanAmountValue,
                    }
                })
            ]);

            return {
                success: true,
                message: 'Onboarding data saved successfully',
                user
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
