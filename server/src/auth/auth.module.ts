import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { StaffGuard } from './staff.guard';
import { AuthorizationService } from './authorization.service';
import { AuditLogService } from './audit-log.service';

import { UserGuard } from './user.guard';
import { ReferralModule } from '../referral/referral.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule,
    forwardRef(() => ReferralModule),
    UsersModule,
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
    StaffGuard,
    AuthorizationService,
    AuditLogService,

    UserGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    UsersModule,
    AdminGuard,
    SuperAdminGuard,
    StaffGuard,
    AuthorizationService,
    AuditLogService,
    UserGuard,
    EmailService,
  ],
})
export class AuthModule { }
