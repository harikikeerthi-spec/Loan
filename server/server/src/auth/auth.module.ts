import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthorizationService } from './authorization.service';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserGuard } from './user.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: 'secretKey', // Use env var in production
      signOptions: { expiresIn: '24h' },
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
