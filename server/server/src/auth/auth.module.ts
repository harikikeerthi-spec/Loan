import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthorizationService } from './authorization.service';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserGuard } from './user.guard';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: (configService.get<string>('JWT_SECRET') || 'secretKey') as any,
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '30m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    AdminGuard,
    SuperAdminGuard,
    AuthorizationService,
    AuditLogService,
    PrismaService,
    UserGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    UsersModule,
    AdminGuard,
    SuperAdminGuard,
    AuthorizationService,
    AuditLogService,
    UserGuard,
  ],
})
export class AuthModule { }
