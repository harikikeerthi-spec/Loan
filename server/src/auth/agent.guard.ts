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
export class AgentGuard implements CanActivate {
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
            const payload = await this.jwtService.verifyAsync(token);
            const user = await this.usersService.findOne(payload.email);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Check if user is agent or higher
            const allowedRoles = ['agent', 'staff', 'admin', 'super_admin'];
            if (!allowedRoles.includes(user.role)) {
                throw new ForbiddenException('Access denied. Agent privileges required.');
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
                    statusCode: 401
                });
            }

            throw new UnauthorizedException('Invalid token');
        }
    }
}
