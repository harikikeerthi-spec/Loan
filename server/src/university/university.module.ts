import { Module } from '@nestjs/common';
import { UniversityInquiryController } from './university-inquiry.controller';
import { UniversityInquiryService } from './university-inquiry.service';
import { EmailService } from '../auth/email.service';

@Module({
    controllers: [UniversityInquiryController],
    providers: [UniversityInquiryService, EmailService],
})
export class UniversityModule { }
