import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortApplicationDto } from './dto/create-cohort-application.dto';

@Injectable()
export class ConnectedService {
    constructor(private readonly prisma: PrismaService) { }

    /** Submit a new cohort application (public) */
    async create(dto: CreateCohortApplicationDto) {
        // Prevent duplicate submissions from the same email for the same intake
        const existing = await this.prisma.cohortApplication.findFirst({
            where: { email: dto.email, targetIntake: dto.targetIntake },
        });

        if (existing) {
            throw new ConflictException(
                'An application with this email already exists for the selected intake.',
            );
        }

        const application = await this.prisma.cohortApplication.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                phone: dto.phone,
                targetIntake: dto.targetIntake,
                destination: dto.destination,
                university: dto.university,
                course: dto.course,
                gapYear: dto.gapYear ?? false,
                message: dto.message,
                source: dto.source ?? 'connectED',
            },
        });

        return { success: true, id: application.id };
    }

    /** List all applications — admin use */
    async findAll(status?: string) {
        return this.prisma.cohortApplication.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Update status — admin use */
    async updateStatus(
        id: string,
        status: string,
        reviewedBy?: string,
        reviewNotes?: string,
    ) {
        return this.prisma.cohortApplication.update({
            where: { id },
            data: {
                status,
                reviewedBy,
                reviewNotes,
                reviewedAt: new Date(),
            },
        });
    }
}
