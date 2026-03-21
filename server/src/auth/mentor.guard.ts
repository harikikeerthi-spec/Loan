import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MentorGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key',
            });

            // Verify this is a mentor token
            if (payload.role !== 'mentor') {
                throw new UnauthorizedException('Not a mentor account');
            }

            // Verify mentor exists and is active
            const mentor = await this.prisma.mentor.findUnique({
                where: { id: payload.mentorId },
            });

            if (!mentor || !mentor.isActive || !mentor.isApproved) {
                throw new UnauthorizedException('Mentor account not active');
            }

            request['mentor'] = {
                id: mentor.id,
                email: mentor.email,
                name: mentor.name,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
