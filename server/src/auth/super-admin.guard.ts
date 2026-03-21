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
export class SuperAdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

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
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Get user from database
      const user = await this.usersService.findOne(payload.email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is super_admin
      if (user.role !== 'super_admin') {
        throw new ForbiddenException('Access denied. Super Admin privileges required.');
      }

      // Attach user to request for use in controllers
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

      throw new UnauthorizedException('Invalid token');
    }
  }
}
