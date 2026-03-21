import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferenceService {
    constructor(private prisma: PrismaService) { }

    // ==================== LOAN TYPES ====================

    async getAllLoanTypes() {
        const loanTypes = await this.prisma.loanType.findMany({
            orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
        });

        return {
            success: true,
            data: loanTypes,
        };
    }

    async getPopularLoanTypes() {
        const loanTypes = await this.prisma.loanType.findMany({
            where: { isPopular: true },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: loanTypes,
        };
    }

    async getLoanTypeById(id: string) {
        const loanType = await this.prisma.loanType.findUnique({
            where: { id },
        });

        return {
            success: true,
            data: loanType,
        };
    }

    // ==================== UNIVERSITIES ====================

    async getAllUniversities(filters: any) {
        const { country, ranking, limit, offset } = filters;
        const where: any = {};

        if (country) {
            where.country = { contains: country, mode: 'insensitive' };
        }
        if (ranking) {
            where.ranking = { lte: parseInt(ranking) };
        }

        const [universities, total] = await Promise.all([
            this.prisma.university.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: [{ isFeatured: 'desc' }, { ranking: 'asc' }],
            }),
            this.prisma.university.count({ where }),
        ]);

        return {
            success: true,
            data: universities,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + universities.length < total,
            },
        };
    }

    async getFeaturedUniversities(limit: number) {
        const universities = await this.prisma.university.findMany({
            where: { isFeatured: true },
            take: limit,
            orderBy: { ranking: 'asc' },
        });

        return {
            success: true,
            data: universities,
        };
    }

    async getUniversityById(id: string) {
        const university = await this.prisma.university.findUnique({
            where: { id },
        });

        return {
            success: true,
            data: university,
        };
    }

    async getUniversitiesByCountry(country: string) {
        const universities = await this.prisma.university.findMany({
            where: { country: { equals: country, mode: 'insensitive' } },
            orderBy: { ranking: 'asc' },
        });

        return {
            success: true,
            data: universities,
        };
    }

    // ==================== BANKS ====================

    async getAllBanks() {
        const banks = await this.prisma.bank.findMany({
            orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
        });

        return {
            success: true,
            data: banks,
        };
    }

    async getPopularBanks() {
        const banks = await this.prisma.bank.findMany({
            where: { isPopular: true },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: banks,
        };
    }

    async getBankById(id: string) {
        const bank = await this.prisma.bank.findUnique({
            where: { id },
        });

        return {
            success: true,
            data: bank,
        };
    }

    async getBanksByType(type: string) {
        const banks = await this.prisma.bank.findMany({
            where: { type },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: banks,
        };
    }

    // ==================== COUNTRIES ====================

    async getAllCountries() {
        const countries = await this.prisma.country.findMany({
            orderBy: [{ popularForStudy: 'desc' }, { name: 'asc' }],
        });

        return {
            success: true,
            data: countries,
        };
    }

    async getPopularCountries() {
        const countries = await this.prisma.country.findMany({
            where: { popularForStudy: true },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: countries,
        };
    }

    async getCountryById(id: string) {
        const country = await this.prisma.country.findUnique({
            where: { id },
        });

        return {
            success: true,
            data: country,
        };
    }

    async getCountryByCode(code: string) {
        const country = await this.prisma.country.findUnique({
            where: { code: code.toUpperCase() },
        });

        return {
            success: true,
            data: country,
        };
    }

    async getCountriesByRegion(region: string) {
        const countries = await this.prisma.country.findMany({
            where: { region: { contains: region, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: countries,
        };
    }

    // ==================== SCHOLARSHIPS ====================

    async getAllScholarships(filters: any) {
        const { country, type, limit, offset } = filters;
        const where: any = { isActive: true };

        if (country) {
            where.country = { contains: country, mode: 'insensitive' };
        }
        if (type) {
            where.type = type;
        }

        const [scholarships, total] = await Promise.all([
            this.prisma.scholarship.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.scholarship.count({ where }),
        ]);

        return {
            success: true,
            data: scholarships,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + scholarships.length < total,
            },
        };
    }

    async getScholarshipById(id: string) {
        const scholarship = await this.prisma.scholarship.findUnique({
            where: { id },
        });

        return {
            success: true,
            data: scholarship,
        };
    }

    async getScholarshipsByCountry(country: string) {
        const scholarships = await this.prisma.scholarship.findMany({
            where: {
                country: { equals: country, mode: 'insensitive' },
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            data: scholarships,
        };
    }

    // ==================== COURSES ====================

    async getAllCourses(filters: any) {
        const { level, field, limit, offset } = filters;
        const where: any = {};

        if (level) {
            where.level = { contains: level, mode: 'insensitive' };
        }
        if (field) {
            where.field = { contains: field, mode: 'insensitive' };
        }

        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
            }),
            this.prisma.course.count({ where }),
        ]);

        return {
            success: true,
            data: courses,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + courses.length < total,
            },
        };
    }

    async getPopularCourses() {
        const courses = await this.prisma.course.findMany({
            where: { isPopular: true },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: courses,
        };
    }

    async getCourseById(id: string) {
        const course = await this.prisma.course.findUnique({
            where: { id },
        });

        return {
            success: true,
            data: course,
        };
    }

    async getCoursesByLevel(level: string) {
        const courses = await this.prisma.course.findMany({
            where: { level: { contains: level, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: courses,
        };
    }

    async getCoursesByField(field: string) {
        const courses = await this.prisma.course.findMany({
            where: { field: { contains: field, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
        });

        return {
            success: true,
            data: courses,
        };
    }
}
