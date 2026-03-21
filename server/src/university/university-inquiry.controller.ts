import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UniversityInquiryService } from './university-inquiry.service';

@Controller('university-inquiry')
export class UniversityInquiryController {
    constructor(private readonly inquiryService: UniversityInquiryService) { }

    @Post()
    async create(@Body() body: {
        userId?: string;
        name: string;
        email: string;
        mobile: string;
        universityName: string;
        type: 'callback' | 'fasttrack';
    }) {
        return this.inquiryService.createInquiry(body);
    }

    @Get('check')
    async check(
        @Query('email') email: string,
        @Query('universityName') universityName: string,
        @Query('type') type: string,
    ) {
        return this.inquiryService.checkInquiry(email, universityName, type);
    }
}
