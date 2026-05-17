import { Module } from '@nestjs/common';
import { StaffProfileController } from './staff-profile.controller';
import { StaffProfileService } from './staff-profile.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [UsersModule, AuthModule, DocumentModule],
  controllers: [StaffProfileController],
  providers: [StaffProfileService],
  exports: [StaffProfileService],
})
export class StaffProfileModule {}
