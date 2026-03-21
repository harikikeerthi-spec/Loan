import { Module } from '@nestjs/common';
import { UniversityInquiryController } from './university-inquiry.controller';
import { UniversityInquiryService } from './university-inquiry.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';

@Module({
    controllers: [UniversityInquiryController],
    providers: [UniversityInquiryService, PrismaService, EmailService],
})
export class UniversityModule { }
