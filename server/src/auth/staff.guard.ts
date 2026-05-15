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
export class StaffGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        let token: string | undefined;

        if (authHeader) {
            const [type, tokenStr] = authHeader.split(' ');
            if (type !== 'Bearer' || !tokenStr) {
                throw new UnauthorizedException('Invalid authorization format');
            }
            token = tokenStr;
        } else if (request.query.token) {
            token = request.query.token as string;
        }

        if (!token) {
            throw new UnauthorizedException('No authorization token provided');
        }

        try {
            // Verify JWT token
            const payload = await this.jwtService.verifyAsync(token);
            console.log('[StaffGuard] Token verified. Payload:', { email: payload.email, role: payload.role });

            // Get user from database
            const user = await this.usersService.findOne(payload.email);

            if (!user) {
                console.error('[StaffGuard] User not found in DB for email:', payload.email);
                throw new UnauthorizedException('User not found');
            }

            // Check if user is staff, admin, super_admin, or bank
            const allowedRoles = ['staff', 'admin', 'super_admin', 'bank', 'partner_bank'];
            if (!allowedRoles.includes(user.role)) {
                console.warn(`[StaffGuard] Access denied for role: ${user.role}. User: ${user.email}`);
                throw new ForbiddenException('Access denied. Elevated privileges required.');
            }

            // Attach user to request for use in controllers
            request.user = user;
            console.log(`[StaffGuard] Access granted to ${user.email} (${user.role})`);

            return true;
        } catch (error) {
            console.error('[StaffGuard] Error:', error.message || error);
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

            throw new UnauthorizedException('Invalid token');
        }
    }
}
