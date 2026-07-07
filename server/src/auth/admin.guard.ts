import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('No authorization token provided');
        }

        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Invalid authorization format');
        }

        try {
            // Verify JWT token signature and expiry
            const payload = await this.jwtService.verifyAsync(token);

            const allowedRoles = ['admin', 'super_admin', 'staff', 'bank', 'partner_bank'];

            // Fast path: role is embedded in the JWT payload — no DB lookup needed
            if (payload.role && allowedRoles.includes(payload.role)) {
                request.user = {
                    id: payload.sub || payload.id,
                    email: payload.email,
                    role: payload.role,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                };
                return true;
            }

            // Slow path: role not in payload, fetch from DB
            const user = await this.usersService.findOne(payload.email);

            if (!user) {
                console.error('[AdminGuard] User not found in DB for email:', payload.email);
                throw new UnauthorizedException('User not found');
            }

            if (!allowedRoles.includes(user.role)) {
                console.warn(`[AdminGuard] Access denied for role: ${user.role}. User: ${user.email}`);
                throw new ForbiddenException('Access denied. Elevated privileges required.');
            }

            request.user = user;
            return true;
        } catch (error) {
            if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
                throw error;
            }

            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException({
                    message: 'Token has expired',
                    error: 'Unauthorized',
                    statusCode: 401,
                    hint: 'Please use the /auth/refresh endpoint with your refresh_token to get a new access token'
                });
            }

            console.error('[AdminGuard] Token verification failed:', error.message || error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}
