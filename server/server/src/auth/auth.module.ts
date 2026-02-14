import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin.guard';
import { UserGuard } from './user.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: 'secretKey', // Use env var in production
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, AdminGuard, UserGuard],
  exports: [AuthService, JwtModule, AdminGuard, UserGuard],
})
export class AuthModule { }
