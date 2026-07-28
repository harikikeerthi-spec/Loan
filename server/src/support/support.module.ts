import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../document/s3.service';

@Module({
  imports: [AuthModule],
  controllers: [SupportController],
  providers: [SupportService, S3Service],
  exports: [SupportService],
})
export class SupportModule {}

