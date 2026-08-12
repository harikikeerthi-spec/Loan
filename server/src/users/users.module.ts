import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { AssignmentModule } from '../assignment/assignment.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => AssignmentModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
